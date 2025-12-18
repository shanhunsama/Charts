// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "ChartServerManager.generated.h"
// 图表数据类型
USTRUCT(BlueprintType)
struct FChartData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    TArray<float> Values;

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    TArray<FString> Labels;

    FChartData() = default;
    
    FChartData(const TArray<float>& InValues, const TArray<FString>& InLabels)
        : Values(InValues), Labels(InLabels) {}
};

// 服务器配置
USTRUCT(BlueprintType)
struct FChartConfig
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    FString Host = "127.0.0.1";

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    int32 PreferredPort = 8500;

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    int32 MaxPort = 8600;

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    bool AutoStart = true;

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    float CheckInterval = 5.0f;

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    bool UseFixedProxy = true;

    UPROPERTY(BlueprintReadWrite, Category = "Chart")
    int32 FixedProxyPort = 8500;
};


// 图表类型枚举
UENUM(BlueprintType)
enum class EChartType : uint8
{
    Line    UMETA(DisplayName = "折线图"),
    Bar     UMETA(DisplayName = "柱状图"),
    Pie     UMETA(DisplayName = "饼图")
};

// 服务器状态
UENUM(BlueprintType)
enum class EServerStatus : uint8
{
    Stopped     UMETA(DisplayName = "已停止"),
    Starting    UMETA(DisplayName = "启动中"),
    Running     UMETA(DisplayName = "运行中"),
    Error       UMETA(DisplayName = "错误")
};
/**
 * 
 */
// HTTP请求回调委托
DECLARE_DYNAMIC_DELEGATE_OneParam(FOnHttpRequestComplete, bool, bSuccess);
DECLARE_DYNAMIC_DELEGATE_TwoParams(FOnHttpRequestCompleteWithData, bool, bSuccess, const FString&, ResponseData);

UCLASS()
class CHARTSERVER_API UChartServerManager : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()
public:
    // 服务器控制
    UFUNCTION(BlueprintCallable, Category = "Chart Server|Control")
    static bool StartChartServer(const FChartConfig& Config);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Control")
    static void StopChartServer();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Control")
    static void RestartChartServer();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Control")
    static bool IsServerRunning();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Control")
    static EServerStatus GetServerStatus();

    // 数据操作
    UFUNCTION(BlueprintCallable, Category = "Chart Server|Data")
    static bool UpdateChartData(const FChartData& Data);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Data", meta = (AdvancedDisplay = "OnComplete"))
    static void UpdateChartDataAsync(const FChartData& Data, const FOnHttpRequestComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Data")
    static bool SwitchChartType(EChartType ChartType);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Data", meta = (AdvancedDisplay = "OnComplete"))
    static void SwitchChartTypeAsync(EChartType ChartType, const FOnHttpRequestComplete& OnComplete);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Data")
    static bool GenerateRandomData(int32 DataCount = 60);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Data", meta = (AdvancedDisplay = "OnComplete"))
    static void GenerateRandomDataAsync(int32 DataCount, const FOnHttpRequestComplete& OnComplete);

    // 信息获取
    UFUNCTION(BlueprintCallable, Category = "Chart Server|Info")
    static FString GetServerURL();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Info")
    static int32 GetServerPort();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Info")
    static FChartData GetCurrentData();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Info", meta = (AdvancedDisplay = "OnComplete"))
    static void GetCurrentDataAsync(const FOnHttpRequestCompleteWithData& OnComplete);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Info")
    static EChartType GetCurrentChartType();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Info")
    static FChartConfig GetCurrentConfig();

    // 工具函数
    UFUNCTION(BlueprintCallable, Category = "Chart Server|Utils")
    static void OpenChartInBrowser();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Utils")
    static bool CheckServerHealth();
    UFUNCTION(BlueprintCallable, Category = "Chart Server|Utils", meta = (AdvancedDisplay = "OnComplete"))
    static void CheckServerHealthAsync(const FOnHttpRequestComplete& OnComplete);
    UFUNCTION(BlueprintCallable, Category = "Chart Server|Utils")
    static FString GetServerVersion();

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Utils")
    static void SetLogLevel(int32 Level); // 0=Error, 1=Warning, 2=Info, 3=Debug

    // 配置管理
    UFUNCTION(BlueprintCallable, Category = "Chart Server|Config")
    static bool SaveConfigToFile(const FString& FileName);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Config")
    static bool LoadConfigFromFile(const FString& FileName);

    UFUNCTION(BlueprintCallable, Category = "Chart Server|Config")
    static FChartConfig GetDefaultConfig();
    UFUNCTION(BlueprintCallable, Category = "Chart Server|Utils")
    static void CleanupZombieProcesses();

private:
    // 私有静态变量
    static FProcHandle ServerProcessHandle;
    static FString CurrentServerURL;
    static int32 CurrentServerPort;
    static EServerStatus CurrentStatus;
    static FChartConfig CurrentConfig;
    static FChartData CachedData;
    static EChartType CachedChartType;

    // 私有方法
    static FString GetServerExecutablePath();
    static FString GetServerDirectory();
    static bool ExecuteServerCommand(const FString& Command);
    static bool CheckPortAvailable(int32 Port);
    static bool SendHttpRequest(const FString& URL, const FString& Verb, const FString& Content, 
                               TFunction<void(bool, const FString&)> Callback);
    static FString ChartTypeToString(EChartType Type);
    static EChartType StringToChartType(const FString& TypeString);
    static void ParseChartDataFromJson(const FString& JsonString, FChartData& OutData);
    static FString ChartDataToJson(const FChartData& Data);

};