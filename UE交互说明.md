# UE WebUI 交互说明

## 前端提供的调用方法

前端提供了以下方法供UE端通过WebUI的call函数调用：

### 1. 更新图表数据
```cpp
// UE端调用示例
WebUI->Call(TEXT("UpdateChartData"), FString(TEXT("{\"values\": [10, 20, 30, 40, 50], \"labels\": [\"数据1\", \"数据2\", \"数据3\", \"数据4\", \"数据5\"]}")));
```

**参数格式：**
- 支持JSON字符串或对象
- 必需字段：`values` (数值数组)
- 可选字段：`labels` (标签数组，如不提供则自动生成)

**支持的格式：**
```json
// 标准格式
{
    "values": [10, 20, 30, 40, 50],
    "labels": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}

// 简单数组格式
[10, 20, 30, 40, 50]

// 嵌套数据格式
{
    "data": [10, 20, 30, 40, 50],
    "labels": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}
```

### 2. 切换图表类型
```cpp
// UE端调用示例
WebUI->Call(TEXT("SwitchChartType"), TEXT("line"));  // 折线图
WebUI->Call(TEXT("SwitchChartType"), TEXT("bar"));   // 柱状图
WebUI->Call(TEXT("SwitchChartType"), TEXT("pie"));   // 饼图
```

**支持的图表类型：**
- `line` - 折线图
- `bar` - 柱状图
- `pie` - 饼图

### 3. 获取图表状态
```cpp
// UE端调用示例
WebUI->Call(TEXT("GetChartStatus"));
```

**返回信息：**
```json
{
    "success": true,
    "currentType": "line",
    "dataCount": 5,
    "labels": ["数据1", "数据2", "数据3", "数据4", "数据5"]
}
```

## UE端调用示例代码

```cpp
// 在UE的C++代码中调用示例

// 更新图表数据
void AMyActor::UpdateChartData()
{
    TSharedPtr<FJsonObject> DataObject = MakeShareable(new FJsonObject);
    
    // 创建数值数组
    TArray<TSharedPtr<FJsonValue>> ValuesArray;
    ValuesArray.Add(MakeShareable(new FJsonValueNumber(10)));
    ValuesArray.Add(MakeShareable(new FJsonValueNumber(20)));
    ValuesArray.Add(MakeShareable(new FJsonValueNumber(30)));
    
    // 创建标签数组
    TArray<TSharedPtr<FJsonValue>> LabelsArray;
    LabelsArray.Add(MakeShareable(new FJsonValueString(TEXT("第一项"))));
    LabelsArray.Add(MakeShareable(new FJsonValueString(TEXT("第二项"))));
    LabelsArray.Add(MakeShareable(new FJsonValueString(TEXT("第三项"))));
    
    DataObject->SetArrayField(TEXT("values"), ValuesArray);
    DataObject->SetArrayField(TEXT("labels"), LabelsArray);
    
    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(DataObject.ToSharedRef(), Writer);
    
    if (WebUI)
    {
        WebUI->Call(TEXT("UpdateChartData"), JsonString);
    }
}

// 切换图表类型
void AMyActor::SwitchToLineChart()
{
    if (WebUI)
    {
        WebUI->Call(TEXT("SwitchChartType"), TEXT("line"));
    }
}

// 获取图表状态
void AMyActor::GetChartStatus()
{
    if (WebUI)
    {
        WebUI->Call(TEXT("GetChartStatus"));
    }
}
```

## 前端界面功能

1. **UE状态显示**：右上角显示UE连接状态和最后更新时间
2. **控制面板**：可折叠的控制面板，支持手动操作
3. **数据更新**：支持UE数据更新和本地随机数据
4. **图表切换**：支持UE控制和手动切换图表类型

## 错误处理

- 如果UE接口未连接，前端会显示"未连接"状态
- 数据格式错误会在控制台显示详细错误信息
- 图表加载失败会显示错误提示界面