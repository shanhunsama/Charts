#include "ChartServerManager.h"

#include <winsock2.h>

#include "Misc/Paths.h"
#include "HAL/PlatformProcess.h"
#include "HAL/FileManager.h"
#include "Misc/FileHelper.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Serialization/JsonSerializer.h"
#include "Dom/JsonObject.h"
#include "JsonObjectConverter.h"
#include "Internationalization/Regex.h"

// 静态变量初始化
FProcHandle UChartServerManager::ServerProcessHandle;
FString UChartServerManager::CurrentServerURL;
int32 UChartServerManager::CurrentServerPort = 0;
EServerStatus UChartServerManager::CurrentStatus = EServerStatus::Stopped;
FChartConfig UChartServerManager::CurrentConfig;
FChartData UChartServerManager::CachedData;
EChartType UChartServerManager::CachedChartType = EChartType::Line;



bool UChartServerManager::StartChartServer(const FChartConfig& Config)
{
    // 停止已运行的服务器
    StopChartServer();
    CurrentConfig = Config;
    CurrentStatus = EServerStatus::Starting;

    // 查找可用端口
    int32 AvailablePort = Config.PreferredPort;
    for (int32 Port = Config.PreferredPort; Port <= Config.MaxPort; Port++)
    {
        if (CheckPortAvailable(Port))
        {
            AvailablePort = Port;
            break;
        }
    }

    // 构建启动命令
    FString ServerPath = GetServerExecutablePath();
    if (ServerPath.IsEmpty())
    {
        UE_LOG(LogTemp, Error, TEXT("Chart server executable not found"));
        CurrentStatus = EServerStatus::Error;
        return false;
    }

    FString FullPath = FString::Printf(TEXT("%s --host %s --port %d --no-info-file"), 
    *ServerPath, *Config.Host, AvailablePort);
    FString Command = FString::Printf(TEXT("--host %s --port %d --no-info-file"), 
    *Config.Host, AvailablePort);
    UE_LOG(LogTemp, Display, TEXT("Running command: %s"), *FullPath);
    // 启动服务器进程
    uint32 ProcessID = 0;
    ServerProcessHandle = FPlatformProcess::CreateProc(
        *ServerPath,
        *Command,
        false,
        false,
        false,
        &ProcessID,
        0,
        nullptr,
        nullptr,
        nullptr
    );

    if (ServerProcessHandle.IsValid())
    {
        CurrentServerPort = AvailablePort;
        CurrentServerURL = FString::Printf(TEXT("http://%s:%d"), *Config.Host, AvailablePort);
        
        // 等待服务器启动并检查状态
        FPlatformProcess::Sleep(2.0f);
        CurrentStatus = EServerStatus::Running;
        UE_LOG(LogTemp, Log, TEXT("Chart Server started successfully at: %s"), *CurrentServerURL);
        return true;
        if (CheckServerHealth())
        {
            CurrentStatus = EServerStatus::Running;
            UE_LOG(LogTemp, Log, TEXT("Chart Server started successfully at: %s"), *CurrentServerURL);
            return true;
        }
        else
        {
            CurrentStatus = EServerStatus::Error;
            UE_LOG(LogTemp, Error, TEXT("Chart Server started but health check failed"));
            return false;
        }
    }

    CurrentStatus = EServerStatus::Error;
    UE_LOG(LogTemp, Error, TEXT("Failed to start Chart Server"));
    return false;
}

void UChartServerManager::StopChartServer()
{
    if (ServerProcessHandle.IsValid())
    {
        CurrentStatus = EServerStatus::Stopped;
        
        // 1. 尝试优雅关闭（发送HTTP关闭请求）
        FString ShutdownURL = CurrentServerURL + TEXT("/api/shutdown");
        
        TSharedRef<IHttpRequest> Request = FHttpModule::Get().CreateRequest();
        Request->SetVerb("POST");
        Request->SetURL(ShutdownURL);
        Request->SetTimeout(3.0f); // 3秒超时
        Request->ProcessRequest();

        // 等待优雅关闭（最多5秒）
        bool bGracefulShutdown = false;
        for (int i = 0; i < 5; i++)
        {
            FPlatformProcess::Sleep(1.0f);
            
            // 检查进程是否还在运行
            if (!FPlatformProcess::IsProcRunning(ServerProcessHandle))
            {
                bGracefulShutdown = true;
                break;
            }
        }

        // 2. 如果优雅关闭失败，强制终止进程
        if (!bGracefulShutdown)
        {
            UE_LOG(LogTemp, Warning, TEXT("Graceful shutdown failed, forcing termination"));
            FPlatformProcess::TerminateProc(ServerProcessHandle, true);
        }

        // 3. 确保进程被关闭
        FPlatformProcess::WaitForProc(ServerProcessHandle);
        FPlatformProcess::CloseProc(ServerProcessHandle);
        ServerProcessHandle.Reset();
        
        CurrentServerURL = TEXT("");
        CurrentServerPort = 0;
        
        UE_LOG(LogTemp, Log, TEXT("Chart Server stopped"));
    }
    //CleanupZombieProcesses();
}

void UChartServerManager::RestartChartServer()
{
    if (IsServerRunning())
    {
        FChartConfig Config = CurrentConfig;
        StopChartServer();
        FPlatformProcess::Sleep(1.0f);
        StartChartServer(Config);
    }
}

bool UChartServerManager::IsServerRunning()
{
    // 只检查状态标记，不进行实时健康检查
    return CurrentStatus == EServerStatus::Running;
}

EServerStatus UChartServerManager::GetServerStatus()
{
    // 直接返回当前状态标记
    return CurrentStatus;
}

bool UChartServerManager::UpdateChartData(const FChartData& Data)
{
    if (CurrentServerURL.IsEmpty() || CurrentStatus != EServerStatus::Running) 
    {
        UE_LOG(LogTemp, Warning, TEXT("Server not running, cannot update chart data"));
        return false;
    }

    FString JsonString = ChartDataToJson(Data);
    FString UpdateURL = CurrentServerURL + TEXT("/api/update");
    
    bool bSuccess = false;
    
    auto Callback = [&bSuccess,&Data](bool bHttpSuccess, const FString& Response)
    {
        if (bHttpSuccess)
        {
            TSharedPtr<FJsonObject> JsonObject;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
            
            if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
            {
                bool bApiSuccess = JsonObject->GetBoolField("success");
                if (bApiSuccess)
                {
                    bSuccess = true;
                    CachedData = Data; // 更新缓存
                }
            }
        }
    };
    
    SendHttpRequest(UpdateURL, "POST", JsonString, Callback);
    return bSuccess;
}

void UChartServerManager::UpdateChartDataAsync(const FChartData& Data, const FOnHttpRequestComplete& OnComplete)
{
    if (CurrentServerURL.IsEmpty() || !IsServerRunning())
    {
        OnComplete.ExecuteIfBound(false);
        return;
    }

    FString JsonString = ChartDataToJson(Data);
    FString UpdateURL = CurrentServerURL + TEXT("/api/update");
    
    auto Callback = [OnComplete, Data](bool bHttpSuccess, const FString& Response)
    {
        bool bSuccess = false;
        if (bHttpSuccess)
        {
            TSharedPtr<FJsonObject> JsonObject;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
            
            if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
            {
                bSuccess = JsonObject->GetBoolField("success");
                if (bSuccess)
                {
                    CachedData = Data; // 更新缓存
                }
            }
        }
        OnComplete.ExecuteIfBound(bSuccess);
    };
    
    SendHttpRequest(UpdateURL, "POST", JsonString, Callback);
}

bool UChartServerManager::SwitchChartType(EChartType ChartType)
{
    if (CurrentServerURL.IsEmpty() || !IsServerRunning()) return false;

    FString TypeString = ChartTypeToString(ChartType);
    
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField("type", TypeString);
    
    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    FString SwitchURL = CurrentServerURL + TEXT("/api/switch");
    
    bool bSuccess = false;
    
    auto Callback = [&bSuccess, ChartType](bool bHttpSuccess, const FString& Response)
    {
        if (bHttpSuccess)
        {
            TSharedPtr<FJsonObject> JsonObject;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
            
            if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
            {
                bSuccess = JsonObject->GetBoolField("success");
                if (bSuccess)
                {
                    CachedChartType = ChartType; // 更新缓存
                }
            }
        }
    };
    
    SendHttpRequest(SwitchURL, "POST", JsonString, Callback);
    return bSuccess;
}

void UChartServerManager::SwitchChartTypeAsync(EChartType ChartType, const FOnHttpRequestComplete& OnComplete)
{
    if (CurrentServerURL.IsEmpty() || !IsServerRunning())
    {
        OnComplete.ExecuteIfBound(false);
        return;
    }

    FString TypeString = ChartTypeToString(ChartType);
    
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField("type", TypeString);
    
    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    FString SwitchURL = CurrentServerURL + TEXT("/api/switch");
    
    auto Callback = [OnComplete, ChartType](bool bHttpSuccess, const FString& Response)
    {
        bool bSuccess = false;
        if (bHttpSuccess)
        {
            TSharedPtr<FJsonObject> JsonObject;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
            
            if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
            {
                bSuccess = JsonObject->GetBoolField("success");
                if (bSuccess)
                {
                    CachedChartType = ChartType; // 更新缓存
                }
            }
        }
        OnComplete.ExecuteIfBound(bSuccess);
    };
    
    SendHttpRequest(SwitchURL, "POST", JsonString, Callback);
}

bool UChartServerManager::GenerateRandomData(int32 DataCount)
{
    if (CurrentServerURL.IsEmpty() || !IsServerRunning()) return false;

    FString RandomURL = CurrentServerURL + TEXT("/api/random");
    
    bool bSuccess = false;
    
    auto Callback = [&bSuccess, DataCount](bool bHttpSuccess, const FString& Response)
    {
        if (bHttpSuccess)
        {
            TSharedPtr<FJsonObject> JsonObject;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
            
            if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
            {
                bSuccess = JsonObject->GetBoolField("success");
                if (bSuccess)
                {
                    // 解析返回的随机数据并更新缓存
                    TSharedPtr<FJsonObject> DataObject = JsonObject->GetObjectField("data");
                    if (DataObject.IsValid())
                    {
                        FChartData NewData;
                        ParseChartDataFromJson(Response, NewData);
                        CachedData = NewData;
                    }
                }
            }
        }
    };
    
    SendHttpRequest(RandomURL, "POST", TEXT(""), Callback);
    return bSuccess;
}

void UChartServerManager::GenerateRandomDataAsync(int32 DataCount, const FOnHttpRequestComplete& OnComplete)
{
    if (CurrentServerURL.IsEmpty() || !IsServerRunning())
    {
        OnComplete.ExecuteIfBound(false);
        return;
    }

    FString RandomURL = CurrentServerURL + TEXT("/api/random");
    
    auto Callback = [OnComplete](bool bHttpSuccess, const FString& Response)
    {
        bool bSuccess = false;
        if (bHttpSuccess)
        {
            TSharedPtr<FJsonObject> JsonObject;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
            
            if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
            {
                bSuccess = JsonObject->GetBoolField("success");
                if (bSuccess)
                {
                    // 解析返回的随机数据并更新缓存
                    TSharedPtr<FJsonObject> DataObject = JsonObject->GetObjectField("data");
                    if (DataObject.IsValid())
                    {
                        FChartData NewData;
                        ParseChartDataFromJson(Response, NewData);
                        CachedData = NewData;
                    }
                }
            }
        }
        OnComplete.ExecuteIfBound(bSuccess);
    };
    
    SendHttpRequest(RandomURL, "POST", TEXT(""), Callback);
}

FString UChartServerManager::GetServerURL()
{
    return CurrentServerURL;
}

int32 UChartServerManager::GetServerPort()
{
    return CurrentServerPort;
}

FChartData UChartServerManager::GetCurrentData()
{
    return CachedData;
}

void UChartServerManager::GetCurrentDataAsync(const FOnHttpRequestCompleteWithData& OnComplete)
{
    if (CurrentServerURL.IsEmpty() || !IsServerRunning())
    {
        OnComplete.ExecuteIfBound(false, TEXT(""));
        return;
    }

    FString ConfigURL = CurrentServerURL + TEXT("/api/config");
    
    auto Callback = [OnComplete](bool bHttpSuccess, const FString& Response)
    {
        if (bHttpSuccess)
        {
            TSharedPtr<FJsonObject> JsonObject;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
            
            if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
            {
                bool bSuccess = JsonObject->GetBoolField("success");
                if (bSuccess)
                {
                    TSharedPtr<FJsonObject> ConfigObject = JsonObject->GetObjectField("config");
                    if (ConfigObject.IsValid())
                    {
                        TSharedPtr<FJsonObject> DataObject = ConfigObject->GetObjectField("data");
                        if (DataObject.IsValid())
                        {
                            FChartData NewData;
                            ParseChartDataFromJson(Response, NewData);
                            CachedData = NewData;
                            OnComplete.ExecuteIfBound(true, Response);
                            return;
                        }
                    }
                }
            }
        }
        OnComplete.ExecuteIfBound(false, Response);
    };
    
    SendHttpRequest(ConfigURL, "GET", TEXT(""), Callback);
}
EChartType UChartServerManager::GetCurrentChartType()
{
    return CachedChartType;
}

FChartConfig UChartServerManager::GetCurrentConfig()
{
    return CurrentConfig;
}

void UChartServerManager::OpenChartInBrowser()
{
    if (!CurrentServerURL.IsEmpty())
    {
        FPlatformProcess::LaunchURL(*CurrentServerURL, nullptr, nullptr);
    }
}

bool UChartServerManager::CheckServerHealth()
{
    if (CurrentServerURL.IsEmpty()) return false;

    FString StatusURL = CurrentServerURL + TEXT("/api/status");
    
    // 使用同步HTTP请求或添加等待机制
    TSharedPtr<IHttpRequest> Request = FHttpModule::Get().CreateRequest();
    Request->SetVerb("GET");
    Request->SetURL(StatusURL);
    Request->SetTimeout(5.0f); // 5秒超时
    
    // 同步执行请求
    Request->ProcessRequest();
    
    // 等待请求完成
    while (Request->GetStatus() == EHttpRequestStatus::Processing)
    {
        FPlatformProcess::Sleep(0.01f); // 等待10毫秒
    }
    
    if (Request->GetStatus() == EHttpRequestStatus::Failed || 
        Request->GetStatus() == EHttpRequestStatus::Failed_ConnectionError)
    {
        UE_LOG(LogTemp, Warning, TEXT("Chart server health check failed: %s"), *Request->GetURL());
        return false;
    }
    
    FHttpResponsePtr Response = Request->GetResponse();
    if (!Response.IsValid())
    {
        UE_LOG(LogTemp, Warning, TEXT("Chart server health check: invalid response"));
        return false;
    }
    
    if (Response->GetResponseCode() != 200)
    {
        UE_LOG(LogTemp, Warning, TEXT("Chart server health check: HTTP %d"), Response->GetResponseCode());
        return false;
    }
    
    FString ResponseContent = Response->GetContentAsString();
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(ResponseContent);
    
    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
    {
        bool bSuccess = JsonObject->GetBoolField("success");
        if (bSuccess)
        {
            UE_LOG(LogTemp, Log, TEXT("Chart server is healthy"));
            return true;
        }
    }
    
    UE_LOG(LogTemp, Warning, TEXT("Chart server health check: invalid JSON response"));
    return false;
}

void UChartServerManager::CheckServerHealthAsync(const FOnHttpRequestComplete& OnComplete)
{
    if (CurrentServerURL.IsEmpty())
    {
        if (CurrentStatus == EServerStatus::Running)
        {
            CurrentStatus = EServerStatus::Error;
        }
        OnComplete.ExecuteIfBound(false);
        return;
    }

    FString StatusURL = CurrentServerURL + TEXT("/api/status");
    
    auto Callback = [OnComplete](bool bHttpSuccess, const FString& Response)
    {
        if (bHttpSuccess)
        {
            TSharedPtr<FJsonObject> JsonObject;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response);
            
            if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
            {
                bool bSuccess = JsonObject->GetBoolField("success");
                if (bSuccess)
                {
                    CurrentStatus = EServerStatus::Running;
                    OnComplete.ExecuteIfBound(true);
                    return;
                }
            }
        }
        CurrentStatus = EServerStatus::Error;
        OnComplete.ExecuteIfBound(false);
    };
    
    SendHttpRequest(StatusURL, "GET", TEXT(""), Callback);
    
}

FString UChartServerManager::GetServerVersion()
{
    // 从可执行文件或配置文件中获取版本信息
    return TEXT("1.0.0");
}

void UChartServerManager::SetLogLevel(int32 Level)
{
    // 设置日志级别（简化实现）
    UE_LOG(LogTemp, Log, TEXT("Chart Server log level set to: %d"), Level);
}

bool UChartServerManager::SaveConfigToFile(const FString& FileName)
{
    FString ConfigDir = FPaths::ProjectSavedDir() / TEXT("ChartServer/");
    FString FullPath = ConfigDir / FileName;
    
    // 创建目录
    IFileManager::Get().MakeDirectory(*ConfigDir, true);
    
    // 保存配置到JSON文件
    TSharedPtr<FJsonObject> JsonObject = FJsonObjectConverter::UStructToJsonObject(CurrentConfig);
    
    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);
    
    return FFileHelper::SaveStringToFile(JsonString, *FullPath);
}

bool UChartServerManager::LoadConfigFromFile(const FString& FileName)
{
    FString ConfigDir = FPaths::ProjectSavedDir() / TEXT("ChartServer/");
    FString FullPath = ConfigDir / FileName;
    
    FString JsonString;
    if (FFileHelper::LoadFileToString(JsonString, *FullPath))
    {
        TSharedPtr<FJsonObject> JsonObject;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
        
        if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
        {
            return FJsonObjectConverter::JsonObjectToUStruct(JsonObject.ToSharedRef(), &CurrentConfig);
        }
    }
    return false;
}

FChartConfig UChartServerManager::GetDefaultConfig()
{
    return FChartConfig();
}

// 私有方法实现
FString UChartServerManager::GetServerExecutablePath()
{
    FString PluginDir = FPaths::ProjectPluginsDir() / TEXT("ChartServer/Binaries/Win64/");
    FString ServerExe = PluginDir / TEXT("chart_server.exe");
    
    if (FPaths::FileExists(ServerExe))
    {
        return ServerExe;
    }
    
    // 后备路径
    FString ProjectDir = FPaths::ProjectDir();
    FString AlternativePath = ProjectDir / TEXT("ChartServer/chart_server.exe");
    
    if (FPaths::FileExists(AlternativePath))
    {
        return AlternativePath;
    }
    
    UE_LOG(LogTemp, Error, TEXT("Chart server executable not found"));
    return TEXT("");
}

bool UChartServerManager::CheckPortAvailable(int32 Port)
{
    // 创建TCP socket检查端口是否可用
    SOCKET TestSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (TestSocket == INVALID_SOCKET)
    {
        return false;
    }
    
    sockaddr_in Service;
    Service.sin_family = AF_INET;
    Service.sin_addr.s_addr = inet_addr("127.0.0.1");
    Service.sin_port = htons(Port);
    
    int32 Result = bind(TestSocket, (SOCKADDR*)&Service, sizeof(Service));
    closesocket(TestSocket);
    
    return Result != SOCKET_ERROR;
}

bool UChartServerManager::SendHttpRequest(const FString& URL, const FString& Verb, const FString& Content, 
                                         TFunction<void(bool, const FString&)> Callback)
{
    TSharedRef<IHttpRequest> Request = FHttpModule::Get().CreateRequest();
    Request->SetVerb(Verb);
    Request->SetURL(URL);
    
    if (!Content.IsEmpty())
    {
        Request->SetHeader("Content-Type", "application/json");
        Request->SetContentAsString(Content);
    }
    
    Request->SetTimeout(10.0f); // 10秒超时
    
    Request->OnProcessRequestComplete().BindLambda([Callback](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
    {
        if (bWasSuccessful && Response.IsValid())
        {
            Callback(true, Response->GetContentAsString());
        }
        else
        {
            Callback(false, TEXT(""));
        }
    });
    
    return Request->ProcessRequest();
}

FString UChartServerManager::ChartTypeToString(EChartType Type)
{
    switch (Type)
    {
    case EChartType::Line: return TEXT("line");
    case EChartType::Bar: return TEXT("bar");
    case EChartType::Pie: return TEXT("pie");
    default: return TEXT("line");
    }
}

EChartType UChartServerManager::StringToChartType(const FString& TypeString)
{
    if (TypeString.Equals("line", ESearchCase::IgnoreCase)) return EChartType::Line;
    if (TypeString.Equals("bar", ESearchCase::IgnoreCase)) return EChartType::Bar;
    if (TypeString.Equals("pie", ESearchCase::IgnoreCase)) return EChartType::Pie;
    return EChartType::Line;
}

void UChartServerManager::ParseChartDataFromJson(const FString& JsonString, FChartData& OutData)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
    
    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
    {
        // 尝试从不同位置解析数据
        TSharedPtr<FJsonObject> DataObject = JsonObject->GetObjectField("data");
        if (!DataObject.IsValid())
        {
            DataObject = JsonObject->GetObjectField("config");
            if (DataObject.IsValid())
            {
                DataObject = DataObject->GetObjectField("data");
            }
        }
        
        if (DataObject.IsValid())
        {
            // 解析values数组
            TArray<TSharedPtr<FJsonValue>> ValuesArray = DataObject->GetArrayField("values");
            for (const auto& Value : ValuesArray)
            {
                OutData.Values.Add(Value->AsNumber());
            }
            
            // 解析labels数组
            TArray<TSharedPtr<FJsonValue>> LabelsArray = DataObject->GetArrayField("labels");
            for (const auto& Label : LabelsArray)
            {
                OutData.Labels.Add(Label->AsString());
            }
        }
    }
}

FString UChartServerManager::ChartDataToJson(const FChartData& Data)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    
    // 构建values数组
    TArray<TSharedPtr<FJsonValue>> ValuesArray;
    for (float Value : Data.Values)
    {
        ValuesArray.Add(MakeShareable(new FJsonValueNumber(Value)));
    }
    JsonObject->SetArrayField("values", ValuesArray);
    
    // 构建labels数组
    TArray<TSharedPtr<FJsonValue>> LabelsArray;
    for (const FString& Label : Data.Labels)
    {
        LabelsArray.Add(MakeShareable(new FJsonValueString(Label)));
    }
    JsonObject->SetArrayField("labels", LabelsArray);
    
    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);
    
    return JsonString;
}
// 僵尸进程清理方法
void UChartServerManager::CleanupZombieProcesses()
{
    UE_LOG(LogTemp, Log, TEXT("开始清理Chart Server僵尸进程..."));
    
    // 1. 检查当前进程句柄是否有效但进程已死亡
    if (ServerProcessHandle.IsValid() && !FPlatformProcess::IsProcRunning(ServerProcessHandle))
    {
        UE_LOG(LogTemp, Warning, TEXT("发现僵尸进程句柄，正在清理..."));
        FPlatformProcess::CloseProc(ServerProcessHandle);
        ServerProcessHandle.Reset();
        CurrentStatus = EServerStatus::Stopped;
        CurrentServerURL = TEXT("");
        CurrentServerPort = 0;
        UE_LOG(LogTemp, Log, TEXT("僵尸进程句柄已清理"));
    }
    
    // 2. 检查端口占用情况，查找可能的僵尸进程

    for (int32 Port =5000;Port<=5010;Port++)
    {
        if (!CheckPortAvailable(Port))
        {
            UE_LOG(LogTemp, Warning, TEXT("端口 %d 被占用，可能存在僵尸进程"), Port);
            
            // 尝试通过HTTP请求检查是否为Chart Server进程
            FString TestURL = FString::Printf(TEXT("http://127.0.0.1:%d/api/status"), Port);
            
            TSharedRef<IHttpRequest> Request = FHttpModule::Get().CreateRequest();
            Request->SetVerb("GET");
            Request->SetURL(TestURL);
            Request->SetTimeout(2.0f);
            
            // 同步执行请求检查
            Request->ProcessRequest();
            
            // 等待请求完成
            while (Request->GetStatus() == EHttpRequestStatus::Processing)
            {
                FPlatformProcess::Sleep(0.01f);
            }
            
            FHttpResponsePtr Response = Request->GetResponse();
            if (Response.IsValid() && Response->GetResponseCode() == 200)
            {
                FString ResponseContent = Response->GetContentAsString();
                if (ResponseContent.Contains("chart") || ResponseContent.Contains("ChartServer"))
                {
                    UE_LOG(LogTemp, Warning, TEXT("确认端口 %d 被Chart Server僵尸进程占用"), Port);
                    
                    // 发送关闭请求
                    FString ShutdownURL = FString::Printf(TEXT("http://127.0.0.1:%d/api/shutdown"), Port);
                    TSharedRef<IHttpRequest> ShutdownRequest = FHttpModule::Get().CreateRequest();
                    ShutdownRequest->SetVerb("POST");
                    ShutdownRequest->SetURL(ShutdownURL);
                    ShutdownRequest->SetTimeout(3.0f);
                    ShutdownRequest->ProcessRequest();
                    
                    UE_LOG(LogTemp, Log, TEXT("已向僵尸进程发送关闭请求"));
                }
            }
        }
    }
    
//     // 3. 使用系统命令查找并终止可能的僵尸进程（Windows平台）
// #if PLATFORM_WINDOWS
//     FString Command = TEXT("tasklist /FI \"IMAGENAME eq chart_server.exe\" /FO CSV /NH");
//     FString Output;
//     FString ErrorOutput;
//     uint32 ExitCode;
//     FPlatformProcess::ExecProcess(*Command, nullptr, &Output, nullptr, &Output, &ErrorOutput, &ExitCode);
//     
//     if (Output.Contains("chart_server.exe"))
//     {
//         UE_LOG(LogTemp, Warning, TEXT("发现chart_server.exe进程正在运行，尝试终止..."));
//         
//         // 终止进程
//         FString KillCommand = TEXT("taskkill /F /IM chart_server.exe");
//         FString KillOutput;
//         FString KillErrorOutput;
//         uint32 KillExitCode;
//         FPlatformProcess::ExecProcess(*KillCommand, nullptr, &KillOutput, nullptr, &KillOutput, &KillErrorOutput, &KillExitCode);
//         
//         UE_LOG(LogTemp, Log, TEXT("进程终止命令执行结果: %s"), *KillOutput);
//     }
// #endif
    
    UE_LOG(LogTemp, Log, TEXT("僵尸进程清理完成"));
}
