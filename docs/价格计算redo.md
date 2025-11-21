# 场馆预订系统价格配置设计文档

## 1. 概述

本文档定义了场馆预订系统的价格配置方案，包括基础项目价格、时段价格、特殊日期价格以及会员价格等各项规则。此配置方案旨在提供灵活的定价策略，满足各类场馆运营需求。

## 2. 数据结构

### 2.1 项目定义

项目是价格配置的基础单位，每个项目包含以下属性：

```json
{
  "items": [
    {
      "itemId": 0,                   // 项目ID
      "itemName": "basketball",      // 项目名称
      "itemCode": "BASKETBALL_001",  // 项目编码，用于系统识别
      "basePrice": 1000,             // 基础价格，单位：分
      "priceUnit": "segment",        // 计价单位：segment（按时段）或 fixed（固定）
      "enabled": true                // 是否启用
    }
  ]
}
```

### 2.2 时段价格配置

时段价格允许根据一天中的不同时间段设置不同的价格策略：

```json
{
  "timeSegmentation": {
    "enabled": true,                // 是否启用时段价格
    "segments": [                   // 支持多个时段，按时间顺序排列
      {
        "segmentId": 1,
        "startTime": "0000",        // 开始时间，24小时制HHMM
        "endTime": "0800",          // 结束时间，24小时制HHMM
        "priceMode": "multiplier",  // 定价模式：multiplier（倍率）, fixed（固定价格）, override（覆盖）
        "multiplier": 0.8,          // 倍率（仅在multiplier模式下有效）
        "fixedPrice": 0,            // 固定价格（仅在fixed模式下有效）
        "overridePrice": 5000,      // 覆盖价格，所有项目统一价格（仅在override模式下有效）
        "segmentDuration": 30       // 计费时段长度：15, 30, 60（分钟）
      }
    ]
  }
}
```

### 2.3 特殊日期规则

特殊日期规则用于处理节假日、周末等特殊时间的价格调整：

```json
{
  "specialDayRules": {
    "enabled": true,
    "rules": [
      {
        "ruleId": "LEGAL_HOLIDAY",
        "ruleType": "legalHoliday",  // 规则类型：legalHoliday, beforeLegalHoliday, afterLegalHoliday, weekDay
        "enabled": true,
        "multiplier": 1.5,           // 价格倍率
        "timeRange": {
          "startTime": "0000",
          "endTime": "0000"          // 0000-0000表示全天
        },
        "daysBefore": 0,             // 节前天数（仅beforeLegalHoliday类型有效）
        "daysAfter": 0,              // 节后天数（仅afterLegalHoliday类型有效）
        "weekDays": []               // 周几，0-6代表周一到周日（仅weekDay类型有效）
      }
    ],
    "conflictResolution": "highest", // 冲突解决方案：highest, lowest, specific
    "specificMultiplier": 1.4        // 特定倍率（仅在specific模式下有效）
  }
}
```

### 2.4 会员配置

会员配置定义了不同类型会员卡的价格和权益：

```json
{
  "membershipTypes": {
    "passCard": {                   // 通票
      "enabled": true,
      "dailyPrice": 12800,          // 日均价格，单位：分
      "validityDays": 30,           // 有效期天数
      "description": "30天内无限次使用所有项目"
    },
    "discountCard": {               // 折扣卡
      "enabled": true,
      "dailyPrice": 10000,
      "validityDays": 30,
      "discountRate": 0.4,          // 折扣率
      "description": "30天内所有项目4折"
    },
    "countCard": {                  // 次卡
      "enabled": true,
      "pricePerUse": 3000,          // 单次价格
      "totalCount": 10,             // 总次数
      "timeRange": {
        "startTime": "0800",
        "endTime": "2200"           // 可用时间范围
      },
      "description": "10次卡，仅限8:00-22:00使用"
    },
    "itemSpecificCard": {           // 特定项目免票
      "enabled": true,
      "dailyPrice": 5000,
      "validityDays": 30,
      "applicableItems": [0, 1],    // 适用的itemId列表
      "description": "30天内指定项目免费"
    }
  }
}
```

## 3. 规则说明

### 3.1 时段计算规则

- 时段按照24小时制定义，支持跨天时段（如22:00-06:00）
- 时段不能重叠，系统按时间顺序验证
- 未覆盖的时间段将按项目基础价格计算
- 当时段定价模式为`override`时，所有项目在该时段内使用统一价格
- 时段计费单位（`segmentDuration`）决定最小计费单位，可设置为15分钟、30分钟或1小时

### 3.2 特殊日期规则

- **法定节假日**：系统根据国家法定节假日数据（如国务院发布的假期安排）自动识别
- **节前节后**：可设置节假日前后的特定天数采用不同价格
- **周几规则**：可设置每周特定日期的价格策略

当多条规则同时满足时，根据`conflictResolution`设置处理：
- `highest`：采用最高倍率
- `lowest`：采用最低倍率
- `specific`：采用特定倍率（`specificMultiplier`）

### 3.3 会员优先级

当用户同时拥有多种会员卡时，系统自动选择对用户最有利的方式计费：

1. 通票（passCard）> 特定项目免票（itemSpecificCard）> 次卡（countCard）> 折扣卡（discountCard）
2. 特定项目免票仅对指定项目有效
3. 次卡仅在指定时间范围内有效
4. 折扣卡对所有项目在所有时间有效

### 3.4 价格计算公式

```
最终价格 = 基础价格 × 时段倍率 × 特殊日期倍率 × 会员折扣
```

## 4. 配置示例

### 4.1 基础配置（仅按时段计费）

```json
{
  "items": [
    {
      "itemId": 0,
      "itemName": "篮球场",
      "itemCode": "BASKETBALL_001",
      "basePrice": 1000, // 每30分钟10元
      "priceUnit": "segment",
      "enabled": true
    },
    {
      "itemId": 1,
      "itemName": "羽毛球场",
      "itemCode": "BADMINTON_001",
      "basePrice": 1500, // 每30分钟15元
      "priceUnit": "segment",
      "enabled": true
    }
  ],
  
  "timeSegmentation": {
    "enabled": true,
    "segments": [
      {
        "segmentId": 1,
        "startTime": "0000",
        "endTime": "0800",
        "priceMode": "multiplier",
        "multiplier": 0.6, // 凌晨时段6折
        "segmentDuration": 30
      },
      {
        "segmentId": 2,
        "startTime": "0800",
        "endTime": "1800",
        "priceMode": "multiplier",
        "multiplier": 1.0, // 白天正常价格
        "segmentDuration": 30
      },
      {
        "segmentId": 3,
        "startTime": "1800",
        "endTime": "2400",
        "priceMode": "multiplier",
        "multiplier": 1.2, // 晚间高峰1.2倍
        "segmentDuration": 30
      }
    ]
  },
  
  "specialDayRules": {
    "enabled": false
  },
  
  "membershipTypes": {
    "passCard": {"enabled": false},
    "discountCard": {"enabled": false},
    "countCard": {"enabled": false},
    "itemSpecificCard": {"enabled": false}
  }
}
```

### 4.2 节假日特殊定价 + 会员折扣

```json
{
  "items": [
    {
      "itemId": 0,
      "itemName": "游泳馆",
      "itemCode": "SWIMMING_001",
      "basePrice": 5000, // 每小时50元
      "priceUnit": "segment",
      "enabled": true
    }
  ],
  
  "timeSegmentation": {
    "enabled": true,
    "segments": [
      {
        "segmentId": 1,
        "startTime": "0000",
        "endTime": "2400",
        "priceMode": "multiplier",
        "multiplier": 1.0,
        "segmentDuration": 60 // 按小时计费
      }
    ]
  },
  
  "specialDayRules": {
    "enabled": true,
    "rules": [
      {
        "ruleId": "LEGAL_HOLIDAY",
        "ruleType": "legalHoliday",
        "enabled": true,
        "multiplier": 1.5, // 法定节假日1.5倍
        "timeRange": {
          "startTime": "0000",
          "endTime": "0000"
        }
      },
      {
        "ruleId": "WEEKEND",
        "ruleType": "weekDay",
        "enabled": true,
        "multiplier": 1.2, // 周末1.2倍
        "weekDays": [5, 6], // 周六、周日
        "timeRange": {
          "startTime": "0900",
          "endTime": "2100"
        }
      }
    ],
    "conflictResolution": "highest" // 取最高倍率
  },
  
  "membershipTypes": {
    "passCard": {
      "enabled": true,
      "dailyPrice": 20000, // 月卡200元/天
      "validityDays": 30,
      "description": "月卡用户免费游泳"
    },
    "discountCard": {
      "enabled": true,
      "dailyPrice": 10000, // 折扣卡100元/天
      "validityDays": 30,
      "discountRate": 0.6, // 6折
      "description": "所有时段6折优惠"
    },
    "countCard": {"enabled": false},
    "itemSpecificCard": {"enabled": false}
  }
}
```

### 4.3 复杂时段 + 全时段固定价格

```json
{
  "membershipTypes": {
    "passCard": {"enabled": false},
    "discountCard": {"enabled": false},
    "countCard": {
      "enabled": true,
      "pricePerUse": 5000, // 50元/次
      "totalCount": 20,
      "timeRange": {
        "startTime": "0900",
        "endTime": "1700" // 仅限白天使用
      },
      "description": "20次卡，仅限9:00-17:00使用"
    },
    "itemSpecificCard": {
      "enabled": true,
      "dailyPrice": 8000,
      "validityDays": 30,
      "applicableItems": [0], // 仅网球场
      "description": "网球场月卡"
    }
  }
}
```

### 4.4 多会员卡组合场景

```json
{
  "items": [
    {
      "itemId": 0,
      "itemName": "健身房",
      "itemCode": "GYM_001",
      "basePrice": 3000, // 每小时30元
      "priceUnit": "segment",
      "enabled": true
    },
    {
      "itemId": 1,
      "itemName": "瑜伽室",
      "itemCode": "YOGA_001",
      "basePrice": 5000, // 每小时50元
      "priceUnit": "segment",
      "enabled": true
    }
  ],
  
  "timeSegmentation": {
    "enabled": true,
    "segments": [
      {
        "segmentId": 1,
        "startTime": "0600",
        "endTime": "2200",
        "priceMode": "multiplier",
        "multiplier": 1.0,
        "segmentDuration": 60 // 按小时计费
      },
      {
        "segmentId": 2,
        "startTime": "2200",
        "endTime": "0600",
        "priceMode": "multiplier",
        "multiplier": 0.7, // 夜间优惠
        "segmentDuration": 60
      }
    ]
  },
  
  "specialDayRules": {
    "enabled": true,
    "rules": [
      {
        "ruleId": "MONDAY_DISCOUNT",
        "ruleType": "weekDay",
        "enabled": true,
        "multiplier": 0.8, // 周一8折
        "weekDays": [0], // 周一
        "timeRange": {
          "startTime": "0000",
          "endTime": "0000" // 全天
        }
      }
    ],
    "conflictResolution": "lowest" // 取最低倍率
  },
  
  "membershipTypes": {
    "passCard": {
      "enabled": true,
      "dailyPrice": 30000, // 300元/天
      "validityDays": 30,
      "description": "全场通用月卡"
    },
    "discountCard": {
      "enabled": true,
      "dailyPrice": 15000,
      "validityDays": 30,
      "discountRate": 0.7, // 7折
      "description": "全场7折卡"
    },
    "countCard": {
      "enabled": true,
      "pricePerUse": 2500, // 25元/次
      "totalCount": 15,
      "timeRange": {
        "startTime": "1000",
        "endTime": "1600" // 仅限非高峰时段
      },
      "description": "15次非高峰卡"
    },
    "itemSpecificCard": {
      "enabled": true,
      "dailyPrice": 12000,
      "validityDays": 30,
      "applicableItems": [0], // 仅健身房
      "description": "健身房月卡"
    }
  }
}
```

### 4.5 节假日前后特殊价格

```json
{
  "items": [
    {
      "itemId": 0,
      "itemName": "台球室",
      "itemCode": "BILLIARDS_001",
      "basePrice": 1500, // 每30分钟15元
      "priceUnit": "segment",
      "enabled": true
    }
  ],
  
  "timeSegmentation": {
    "enabled": true,
    "segments": [
      {
        "segmentId": 1,
        "startTime": "0000",
        "endTime": "2400",
        "priceMode": "multiplier",
        "multiplier": 1.0,
        "segmentDuration": 30
      }
    ]
  },
  
  "specialDayRules": {
    "enabled": true,
    "rules": [
      {
        "ruleId": "LEGAL_HOLIDAY",
        "ruleType": "legalHoliday",
        "enabled": true,
        "multiplier": 1.5, // 法定节假日1.5倍
        "timeRange": {
          "startTime": "0000",
          "endTime": "0000"
        }
      },
      {
        "ruleId": "BEFORE_HOLIDAY",
        "ruleType": "beforeLegalHoliday",
        "enabled": true,
        "multiplier": 1.3, // 节前1.3倍
        "daysBefore": 2, // 节前2天
        "timeRange": {
          "startTime": "1800",
          "endTime": "2400"
        }
      },
      {
        "ruleId": "AFTER_HOLIDAY",
        "ruleType": "afterLegalHoliday",
        "enabled": true,
        "multiplier": 0.8, // 节后8折
        "daysAfter": 1, // 节后1天
        "timeRange": {
          "startTime": "0900",
          "endTime": "1800"
        }
      }
    ],
    "conflictResolution": "highest" // 取最高倍率
  },
  
  "membershipTypes": {
    "passCard": {"enabled": false},
    "discountCard": {"enabled": false},
    "countCard": {"enabled": false},
    "itemSpecificCard": {"enabled": false}
  }
}
```

## 5. 实现注意事项

### 5.1 时间处理

1. **时间格式**：所有时间均使用24小时制字符串表示，格式为"HHMM"
2. **跨天处理**：
   - 当结束时间小于开始时间时（如"2200"-"0600"），表示跨天时段
   - 系统自动识别并正确计算跨天时段的价格

### 5.2 特殊日期数据源

系统使用以下格式的法定节假日数据：

```json
{
  "year": 2025,
  "papers": ["国办发明电[2024]15号"],
  "days": [
    {
      "name": "元旦",
      "date": "2025-01-01",
      "isOffDay": true
    },
    {
      "name": "春节",
      "date": "2025-01-29",
      "isOffDay": true
    },
    // 更多节假日...
  ]
}
```

系统将定期从可靠数据源更新法定节假日信息。

### 5.3 价格计算流程

1. **确定基础价格**：根据项目ID获取基础价格
2. **应用时段倍率**：根据预订时间段确定适用的时段价格
3. **应用特殊日期倍率**：检查是否为特殊日期，应用相应倍率
4. **应用会员折扣**：检查用户会员权益，应用最优惠的方案
5. **计算最终价格**：按照公式计算最终价格

### 5.4 边界情况处理

1. **预订跨多个时段**：按比例计算各时段价格并求和
2. **预订跨多个特殊日期**：按比例计算各日期价格并求和
3. **时段未完全覆盖**：未定义的时段使用项目基础价格
4. **会员权益重叠**：自动选择对用户最有利的方案

## 6. 扩展性考虑

### 6.1 未来功能扩展

1. **动态定价**：根据预订率自动调整价格
2. **捆绑销售**：多项目组合优惠
3. **活动促销**：限时特价活动
4. **用户等级**：根据用户等级提供不同折扣
5. **季节性定价**：根据季节自动调整价格策略

### 6.2 数据分析需求

系统应记录以下数据以支持价格策略分析：

1. 不同时段的预订量
2. 不同价格策略下的收入变化
3. 会员卡使用情况和转化率
4. 特殊日期的预订量与普通日期对比

## 7. 配置管理

### 7.1 配置验证

系统在接受新配置前应进行以下验证：

1. 时段是否完整覆盖且无重叠
2. 价格倍率是否在合理范围内
3. 会员折扣是否符合业务规则
4. 特殊日期规则是否有冲突

### 7.2 配置版本控制

1. 每次配置更改应记录版本号和更改人
2. 支持配置回滚功能
3. 配置更改应有预览和测试环境

## 8. 结论

本文档定义了一个灵活、可扩展的场馆预订系统价格配置方案，通过基础项目价格、时段价格、特殊日期价格以及会员价格等多层次规则，可以满足各类场馆运营需求。系统设计考虑了实际业务场景的复杂性，并提供了清晰的规则处理机制。

通过本配置方案，场馆管理者可以：
- 实现差异化定价策略
- 优化场馆资源利用
- 提升会员体验和忠诚度
- 灵活应对市场需求变化

后续可根据实际运营情况持续优化配置方案，增加更多定价功能以满足业务发展需求。