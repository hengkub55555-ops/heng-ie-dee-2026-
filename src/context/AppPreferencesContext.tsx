import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MonthKey, MONTHS } from '../data/mpModelData';

export type Language = 'th' | 'zh' | 'en';
export type ThemeMode = 'light' | 'dark' | 'industrial';

interface AppPreferencesContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: (th: string, zh: string, en: string) => string;
  localizeStationDesc: (stationName: string, fallbackThai: string) => string;
  localizeModelDesc: (modelId: string, fallbackThai: string) => string;
  localizeMonth: (monthKey: MonthKey) => { short: string; full: string; sub: string };
}

const STORAGE_KEY_LANG = 'factory_mp_app_lang_v1';
const STORAGE_KEY_THEME = 'factory_mp_app_theme_v1';

const STATION_TRANSLATIONS: Record<string, { zh: string; en: string }> = {
  Rooling: {
    zh: '箱体辊轧折弯线 (Cabinet Rolling)',
    en: 'Cabinet Rolling & Bending Line',
  },
  'Inner Box2': {
    zh: '内胆预装线 2 (TM14 / 多门 / 对开门)',
    en: 'Inner Box Sub-Assembly 2 (TM14 / Multi-Door / SBS)',
  },
  'Inner Box 1': {
    zh: '内胆预装线 1 (TM19/21 / BM TD / BM)',
    en: 'Inner Box Sub-Assembly 1 (TM19/21 / BM TD / BM)',
  },
  'Cab per2': {
    zh: '箱体预装线 2 (TM14 / 多门 / 对开门)',
    en: 'Cabinet Pre-Assembly 2 (TM14 / Multi-Door / SBS)',
  },
  'Cab per1': {
    zh: '箱体预装线 1 (TM19/21 / BM TD / BM)',
    en: 'Cabinet Pre-Assembly 1 (TM19/21 / BM TD / BM)',
  },
  'เตรียม Compressor': {
    zh: '压缩机预装线 (Compressor Prep)',
    en: 'Compressor Preparation & Sub-Assembly',
  },
  'PU FOAM (Pre-System)': {
    zh: '箱体发泡预装线 (PU Foam Pre-System)',
    en: 'PU Foam Pre-System Preparation',
  },
  'A (SBS/TD Foam)': {
    zh: 'A线发泡后整理 (对开门 / 多门)',
    en: 'Line A Post-Foaming (SBS / Multi-Door)',
  },
  'A (TM/BM Foam)': {
    zh: 'A线发泡后整理 (顶冷 / 底冷机型)',
    en: 'Line A Post-Foaming (Top / Bottom Mount)',
  },
  FG1: {
    zh: '总装 1 段 (管路焊接、抽真空与充注)',
    en: 'Final Assembly 1 (Piping, Vacuum & Refrigerant Charging)',
  },
  FG2: {
    zh: '总装 2 段 (门体安装、内饰件与终检包装)',
    en: 'Final Assembly 2 (Door Mounting, Interior & Final Packing)',
  },
  'A (SBS/TD Final)': {
    zh: 'A段主装配线 (对开门 / 多门冰箱)',
    en: 'Line A Final Assembly (SBS / Multi-Door)',
  },
  'เตรียม Evaporator': {
    zh: '蒸发器预装线 (Evaporator Prep)',
    en: 'Evaporator Preparation & Sub-Assembly',
  },
  'งานเตรียมประตู': {
    zh: '门体预装与门发泡线 (Door Prep & Foam)',
    en: 'Door Preparation & Door Foaming Line',
  },
  'B (SBS/TD Final)': {
    zh: 'B段商检与包装线 (对开门 / 多门)',
    en: 'Line B Inspection, Testing & Packing (SBS / Multi-Door)',
  },
  'B (TM/BM Final)': {
    zh: 'B段商检与包装线 (顶冷 / 底冷机型)',
    en: 'Line B Inspection, Testing & Packing (TM / BM)',
  },
};

const MODEL_TRANSLATIONS: Record<string, { zh: string; en: string }> = {
  'TM19/21': {
    zh: '双门顶冷冰箱 (Top Mount 19/21Q)',
    en: '2-Door Top Mount Refrigerator (19/21Q)',
  },
  TM14: {
    zh: '双门顶冷冰箱 (Top Mount 14Q)',
    en: '2-Door Top Mount Refrigerator (14Q)',
  },
  'BM TD': {
    zh: '三门底冷冰箱 (Bottom Mount TD)',
    en: '3-Door Bottom Mount Refrigerator (BM TD)',
  },
  BM: {
    zh: '双门底冷冰箱 (Bottom Mount)',
    en: '2-Door Bottom Mount Refrigerator (BM)',
  },
  'T-Door': {
    zh: '三门精致冰箱 (Three-Door)',
    en: '3-Door Multi-Door Refrigerator (T-Door)',
  },
  SBS: {
    zh: '对开门大冰箱 (Side-by-Side)',
    en: 'Side-by-Side Large Refrigerator (SBS)',
  },
  'T-Door ice': {
    zh: '三门制冰款冰箱 (T-Door Ice Maker)',
    en: '3-Door Ice Maker Refrigerator (T-Door Ice)',
  },
};

// Ordered phrase dictionary (longest first) for automatic deep translation of all views
const PHRASE_DICTIONARY: Array<[string, string, string]> = [
  // Station Thai Names
  ['งานม้วนพับตัวถัง (Cabinet Rolling)', '箱体辊轧折弯 (Cabinet Rolling)', 'Cabinet Rolling & Bending'],
  ['ประกอบกล่องใน 2 (รุ่น TM14 / Multi-Door / SBS)', '内胆预装 2 (TM14 / 多门 / 对开门)', 'Inner Box Sub-Assy 2 (TM14 / Multi-Door / SBS)'],
  ['ประกอบกล่องใน 1 (รุ่น TM19/21 / BM TD / BM)', '内胆预装 1 (TM19/21 / BM TD / BM)', 'Inner Box Sub-Assy 1 (TM19/21 / BM TD / BM)'],
  ['เตรียมตู้ Cab 2 (รุ่น TM14 / Multi-Door / SBS)', '箱体预装 2 (TM14 / 多门 / 对开门)', 'Cabinet Pre-Assy 2 (TM14 / Multi-Door / SBS)'],
  ['เตรียมตู้ Cab 1 (รุ่น TM19/21 / BM TD / BM)', '箱体预装 1 (TM19/21 / BM TD / BM)', 'Cabinet Pre-Assy 1 (TM19/21 / BM TD / BM)'],
  ['งานเตรียมคอมเพรสเซอร์ (Compressor Prep)', '压缩机预装 (Compressor Prep)', 'Compressor Preparation'],
  ['เตรียมงานก่อนฉีดโฟม PU (PU Foam Pre-System)', '发泡前预装 (PU Foam Pre-System)', 'PU Foam Pre-System Prep'],
  ['ไลน์ฉีดโฟม A (เฉพาะรุ่น SBS / T-Door)', 'A线发泡整理 (对开门 / 多门)', 'Line A Foaming (SBS / T-Door)'],
  ['ไลน์ฉีดโฟม A (เฉพาะรุ่น TM / BM)', 'A线发泡整理 (顶冷 / 底冷)', 'Line A Foaming (TM / BM)'],
  ['งานประกอบขั้นสุดท้าย 1 (ระบบท่อ เชื่อม และแวคคั่ม)', '总装 1 段 (管路焊接与抽真空)', 'Final Assembly 1 (Piping, Welding & Vacuum)'],
  ['งานประกอบขั้นสุดท้าย 2 (ประกอบประตู ชั้นวาง และตกแต่ง)', '总装 2 段 (门体与内饰装配)', 'Final Assembly 2 (Door & Interior Assembly)'],
  ['ไลน์ประกอบหลัก A (เฉพาะรุ่น SBS / T-Door)', 'A段主装配线 (对开门 / 多门)', 'Main Final Line A (SBS / T-Door)'],
  ['งานเตรียมชุดคอยล์เย็น (Evaporator Prep)', '蒸发器预装 (Evaporator Prep)', 'Evaporator Preparation'],
  ['งานเตรียมและฉีดโฟมประตู (Door Prep & Foam)', '门体预装与发泡 (Door Prep & Foam)', 'Door Preparation & Foaming'],
  ['ไลน์ทดสอบและแพ็คกิ้ง B (เฉพาะรุ่น SBS / T-Door)', 'B段检测与包装 (对开门 / 多门)', 'Testing & Packing Line B (SBS / T-Door)'],
  ['ไลน์ทดสอบและแพ็คกิ้ง B (เฉพาะรุ่น TM / BM)', 'B段检测与包装 (顶冷 / 底冷)', 'Testing & Packing Line B (TM / BM)'],

  // Model Thai Names
  ['ตู้เย็น 2 ประตู บน (Top Mount 19/21Q)', '双门顶冷冰箱 (Top Mount 19/21Q)', '2-Door Top Mount (19/21Q)'],
  ['ตู้เย็น 2 ประตู บน (Top Mount 14Q)', '双门顶冷冰箱 (Top Mount 14Q)', '2-Door Top Mount (14Q)'],
  ['ตู้เย็นช่องแข็งล่าง 3 ประตู (Bottom Mount TD)', '三门底冷冰箱 (Bottom Mount TD)', '3-Door Bottom Mount (BM TD)'],
  ['ตู้เย็นช่องแข็งล่าง (Bottom Mount)', '双门底冷冰箱 (Bottom Mount)', 'Bottom Mount (BM)'],
  ['ตู้เย็นมินิมอล 3 ประตู (Three-Door)', '三门冰箱 (Three-Door)', '3-Door Refrigerator (T-Door)'],
  ['ตู้เย็น Side-by-Side 2 ประตูใหญ่', '对开门大冰箱 (Side-by-Side)', 'Side-by-Side Refrigerator (SBS)'],
  ['ตู้เย็น 3 ประตู ระบบทำน้ำแข็ง (T-Door Ice)', '三门制冰冰箱 (T-Door Ice)', '3-Door Ice Maker (T-Door Ice)'],

  // Major Section Titles & Sentences
  [
    'ระบบจำลองปรับเพิ่ม-ลด Volume การผลิต เพื่อคาดการณ์อัตรากำลังคน (Dynamic Volume ↔ Manpower Sheet)',
    '产量增减动态定编测算与预测表 (Dynamic Volume ↔ Manpower Sheet)',
    'Dynamic Production Volume ↔ Manpower Forecasting Sheet',
  ],
  [
    'เพิ่มหรือลด Volume รุ่นใดก็ได้ จำนวนคน MP จะปรับขึ้น-ลงและเชื่อมโยงกับทุกหน้าบน Web ทันที',
    '增减任意机型的订单产量，标准定编人数 (MP) 将实时联动更新至全网所有工作表',
    'Increase or decrease any model volume to immediately forecast MP and sync across all sheets',
  ],
  [
    'Sheet ปรับเพิ่ม-ลด Volume → คาดการณ์ MP ทันที',
    '产量增减动态测算 MP 表',
    'Dynamic Volume → MP Sheet',
  ],
  [
    'แดชบอร์ดวิเคราะห์อัตรากำลังคนและประสิทธิภาพการผลิต',
    '标准定编与生产效率分析看板',
    'Standard Manpower & Production Efficiency Dashboard',
  ],
  [
    'กราฟวิเคราะห์แนวโน้มอัตรากำลังคนมาตรฐานรายเดือน',
    '12个月标准定编人数 (STD MP) 趋势分析图',
    '12-Month Standard Manpower (STD MP) Trend Analysis',
  ],
  [
    'สรุปภาพรวมทุก Sheet บนเว็บ',
    '全网各工作表总览',
    'Factory-Wide All-Sheets Summary',
  ],
  [
    'คลิกเลือกดูแต่ละ Sheet ได้ทันที',
    '点击任意卡片即可切换工作表',
    'Click any card to switch sheets immediately',
  ],
  [
    'คลิกตัวเลขในทุกตารางเพื่อแก้ไขได้ทันที',
    '点击表格中任意数字即可直接编辑',
    'Click any number in the tables to edit directly',
  ],
  [
    'ปรับเพิ่ม-ลด Volume รวมทั้งสายการผลิต',
    '调整整线总订单产量 (Total Volume)',
    'Adjust Total Production Line Volume',
  ],
  [
    'กดปุ่ม % หรือเลื่อนแถบเพื่อเพิ่ม/ลด Volume ทั้ง 7 รุ่นตามสัดส่วนพร้อมกัน',
    '点击百分比按钮或拖动滑块，按比例同步增减 7 款机型产量',
    'Click % buttons or drag the slider to scale all 7 models proportionally',
  ],
  [
    'ลากปรับหรือพิมพ์ยอดผลิตรวม (คัน):',
    '拖动或输入总产量 (台):',
    'Drag or enter total volume (units):',
  ],
  [
    'โหมดคำนวณความเร็วไลน์และเวลาทำงาน',
    '线速 (UPH) 与工作时间计算模式',
    'Line Speed (UPH) & Working Time Mode',
  ],
  [
    'แปรผันตาม Volume',
    '随产量动态联动',
    'Volume-Driven MP',
  ],
  [
    'ล็อก UPH คงที่',
    '固定 UPH 模式',
    'Fixed UPH Mode',
  ],
  [
    'ชั่วโมงเดินไลน์ต่อสัปดาห์ (ชม.)',
    '每周开线工时 (小时/周)',
    'Weekly Line Hours (hrs/wk)',
  ],
  [
    'ล็อกค่า UPH คงที่ (คัน/ชม.)',
    '固定目标 UPH (台/小时)',
    'Fixed Target UPH (units/hr)',
  ],
  [
    'เผื่ออัตราลางาน Buffer (%)',
    '考勤缺勤缓冲率 Buffer (%)',
    'Absenteeism Buffer (%)',
  ],
  [
    'ปรับเพิ่ม-ลด Volume แยกรายรุ่น (7 Models)',
    '分机型增减订单产量 (7 款机型)',
    'Adjust Volume by Individual Model (7 Models)',
  ],
  [
    'แสดงผลกระทบกำลังคน (±MP) รายรุ่นทันที',
    '实时显示各机型对定编人数 (±MP) 的影响',
    'Shows real-time ±MP impact per model',
  ],
  [
    'ส่งค่า Volume & MP ที่จำลองไปยังสัปดาห์อื่น หรือ Sheet 12 เดือน:',
    '将测算产量与 MP 同步至其他周次或 12个月趋势表:',
    'Apply simulated Volume & MP to another week or 12-Month Sheet:',
  ],
  [
    'กราฟความสัมพันธ์เมื่อเพิ่ม-ลด Volume (-40% ถึง +50%) ต่อกำลังคน MP',
    '产量增减 (-40% 至 +50%) 对标准定编 MP 敏感度曲线',
    'Volume Sensitivity Curve (-40% to +50%) vs. Required MP',
  ],
  [
    'คลิกที่แท่งหรือจุดใดก็ได้บนกราฟเพื่อปรับ Volume ไปยังระดับนั้นและคำนวณ MP ทันที',
    '点击柱状图任意档位即可立即切换至该产量并测算定编人数',
    'Click any bar on the chart to jump to that volume level and calculate MP immediately',
  ],
  [
    'ตารางอัตรากำลังคนรายสถานีที่คาดการณ์ทันที',
    '各工段实时预测定编人数明细表',
    'Real-Time Station-by-Station Manpower Forecast Table',
  ],
  [
    'เปรียบเทียบกำลังคนตั้งต้น',
    '对比基准定编人数',
    'Compare baseline MP',
  ],
  [
    'กับกำลังคนที่ต้องใช้จริงเมื่อปรับ Volume (คลิกแถวเพื่อดู/แก้ไขเวลามาตรฐานรายรุ่น)',
    '与调整产量后的预测定编人数（点击行可展开编辑各机型标准工时）',
    'vs. forecasted MP after volume adjustment (click row to edit model standard times)',
  ],
  [
    'แก้ไขเวลามาตรฐานรายรุ่น (วินาที) ของสถานี',
    '编辑该工段各机型标准工时 (秒) —',
    'Edit model standard times (sec) for station',
  ],
  [
    'กราฟแนวโน้มกำลังคนมาตรฐาน (STD MP) รายเดือน ทั้ง 12 เดือน (ม.ค. – ธ.ค.)',
    '全年12个月标准定编人数 (STD MP) 趋势图 (1月–12月)',
    '12-Month Standard Manpower (STD MP) Trend Chart (Jan–Dec)',
  ],
  [
    'คลิกที่จุดเดือนใดก็ได้บนกราฟเพื่อดูการกระจายกำลังคนรายสถานีของเดือนนั้น · ปรับเปลี่ยนโหมดกราฟและสูตร UPH ได้ด้านขวา',
    '点击图表上任意月份查看工段明细 · 右侧可切换图表对比模式与 UPH 公式',
    'Click any month on the chart to inspect station breakdown · Switch chart & UPH modes on the right',
  ],
  [
    'ตารางแผนยอดการผลิต (`订单量`) และตัวแปรคำนวณ MP ทั้ง 12 เดือน',
    '全年12个月订单量与定编测算参数表',
    '12-Month Order Volume & MP Calculation Parameters Table',
  ],
  [
    'ตารางอัตรากำลังคนมาตรฐานรายสถานี (Station-by-Station 12-Month MP)',
    '全年12个月各工段标准定编明细表 (Station-by-Station 12-Month MP)',
    'Station-by-Station 12-Month Standard Manpower Table',
  ],
  [
    'ซิงค์เดือน ก.ย. (9月) จากตาราง 1W–4W',
    '从 1W–4W 周表同步 9月产量',
    'Sync Sep (9月) from 1W–4W Table',
  ],
  [
    'คืนค่าเริ่มต้น 12 เดือน',
    '重置 12个月默认数据',
    'Reset 12-Month Defaults',
  ],
  [
    'กำลังคนเฉลี่ยทั้งปี',
    '全年平均定编人数',
    'Yearly Average MP',
  ],
  [
    'กรอบอัตรากำลังคนทั้งปี:',
    '全年定编人数区间:',
    'Annual MP Range:',
  ],
  [
    'เดือนที่ใช้ MP สูงสุด (Peak Season)',
    '最高定编月份 (旺季 Peak)',
    'Peak Manpower Month',
  ],
  [
    'ยอดผลิตเดือนพีค:',
    '旺季当月产量:',
    'Peak Month Volume:',
  ],
  [
    'เดือนที่ใช้ MP ต่ำสุด (Low Season)',
    '最低定编月份 (淡季 Low)',
    'Lowest Manpower Month',
  ],
  [
    'ส่วนต่าง Peak - Low:',
    '旺淡季定编差值:',
    'Peak - Low Spread:',
  ],
  [
    'ยอดการผลิตรวมทั้งปี',
    '全年累计总产量',
    'Total Annual Production Volume',
  ],
  [
    'เฉลี่ยต่อเดือน:',
    '月均产量:',
    'Monthly Average:',
  ],
  [
    'แยกแผนก CAB vs FG',
    'CAB 与 FG 分部门对比',
    'Split by CAB vs FG',
  ],
  [
    'เปรียบเทียบ LineA vs LineB',
    'LineA 与 LineB 跨线对比',
    'Compare LineA vs LineB',
  ],
  [
    'MP คู่กับ ยอดผลิต (Volume)',
    '定编 MP 与产量双轴对比',
    'MP vs. Production Volume',
  ],
  [
    'ใช้ UPH เป้าหมายรายเดือน',
    '按月度目标 UPH 计算',
    'Use Target Monthly UPH',
  ],
  [
    'คำนวณ UPH ตาม Volume ÷ ชม.ทำงาน',
    '按产量 ÷ 月工时动态计算 UPH',
    'Dynamic UPH (Volume ÷ Working Hrs)',
  ],
  [
    'เดือนที่เลือกตรวจสอบ:',
    '当前选中查看月份:',
    'Selected Inspected Month:',
  ],
  [
    'รวมยอดผลิตรายเดือน (คัน)',
    '月度订单总量合计 (台)',
    'Total Monthly Volume (Units)',
  ],
  [
    'คลิกแก้เพื่อปรับสเกลทั้ง 7 รุ่นอัตโนมัติ',
    '修改此项可按比例自动缩放全部 7 款机型',
    'Edit to proportionally scale all 7 models',
  ],
  [
    'ความเร็วสายการผลิต UPH (คัน/ชม.)',
    '生产线速度 UPH (台/小时)',
    'Line Speed UPH (Units/Hr)',
  ],
  [
    'ชั่วโมงเดินไลน์ต่อเดือน (ชม./เดือน)',
    '月度开线工时 (小时/月)',
    'Monthly Line Working Hours (Hrs/Mo)',
  ],
  [
    'เวลามาตรฐานถ่วงน้ำหนักรวม (加权工时)',
    '加权标准工时合计 (加权工时)',
    'Total Weighted Standard Time (sec)',
  ],
  [
    'อัตรากำลังคนรวม STD MP',
    '标准定编人数合计 STD MP',
    'Total Standard Manpower (STD MP)',
  ],

  // Common Labels & Short Terms
  ['ภาพรวมประสิทธิภาพ', '效率与定编总览', 'Dashboard Overview'],
  ['กราฟแนวโน้ม MP 12 เดือน', '12个月 MP 趋势图', '12-Month MP Trend'],
  ['คาดการณ์กำลังคน MP', '产量动态测算 MP', 'Volume ↔ MP Forecaster'],
  ['ตารางข้อมูลหลัก', '主数据测算表', 'Master Spreadsheet'],
  ['สูตรคำนวณ & เวลารายรุ่น', '测算公式与机型工时', 'IE Formulas & Model ST'],
  ['บันทึก / จัดเก็บข้อมูล', '保存 / 数据版本管理', 'Save / Backup Data'],
  ['คำนวณ MP จาก Volume', '按产量测算 MP', 'Forecast MP by Volume'],
  ['สายการผลิต (区域):', '生产线 (区域):', 'Production Line:'],
  ['ใช้ยอดผลิตเดียวกับ', '复制订单量自', 'Copy Volumes from'],
  ['เลือก Sheet ของ', '选择工作表 —', 'Select Sheet of'],
  ['เชื่อมโยงสัปดาห์:', '联动周次:', 'Linked Week:'],
  ['ซิงค์ข้อมูลสดกับเว็บ', '实时同步全网数据', 'Live Web Sync'],
  ['โหมดทดลองแยก (Sandbox)', '独立沙盒模拟模式', 'Sandbox Mode'],
  ['คืนค่า Volume ต้นฉบับ', '恢复初始基准产量', 'Reset Baseline Volume'],
  ['1. ยอดการผลิตรวมที่ปรับ', '1. 调整后总订单产量', '1. Adjusted Total Volume'],
  ['2. กำลังคนแผนก CAB', '2. CAB 箱体线定编人数', '2. CAB Department MP'],
  ['3. กำลังคนแผนก FG', '3. FG 总装线定编人数', '3. FG Department MP'],
  ['4. รวมกำลังคนทั้งสาย', '4. 整线合计总定编', '4. Combined Line Total MP'],
  ['คลิกดูเฉพาะ CAB', '点击仅看 CAB', 'Click for CAB Only'],
  ['คลิกดูเฉพาะ FG', '点击仅看 FG', 'Click for FG Only'],
  ['เทียบค่าตั้งต้น CAB:', '对比 CAB 基准:', 'vs. CAB Baseline:'],
  ['เทียบค่าตั้งต้น FG:', '对比 FG 基准:', 'vs. FG Baseline:'],
  ['ความเร็วเดินไลน์ (Effective UPH):', '有效线速 (Effective UPH):', 'Effective Line UPH:'],
  ['ยอดตั้งต้น', '初始基准产量', 'Baseline Volume'],
  ['เวลาถ่วงน้ำหนัก:', '加权工时:', 'Weighted ST:'],
  ['เวลาถ่วงน้ำหนัก', '加权工时', 'Weighted ST'],
  ['เวลารวม:', '合计工时:', 'Total ST:'],
  ['รวมทั้งโรงงาน', '全厂合计', 'Factory Total'],
  ['รวมทั้งสายการผลิต', '整线合计', 'Total Production Line'],
  ['รวมทั้งสิ้น', '总计', 'Grand Total'],
  ['สถานีงาน (Station)', '工段名称 (线段)', 'Station Name'],
  ['สถานีงาน', '工段', 'Station'],
  ['ชม.งานรวม', '总工时', 'Man-Hours'],
  ['MP ตั้งต้น', '基准 MP', 'Baseline MP'],
  ['MP คาดการณ์ใหม่', '预测定编 MP', 'Forecast MP'],
  ['ส่วนต่าง (±MP)', '定编差值 (±MP)', 'Delta (±MP)'],
  ['อัปเดตลงกราฟ 12 เดือน', '同步更新至 12个月趋势图', 'Update 12-Month Trend'],
  ['บันทึกลง', '保存至', 'Save to'],
  ['อัตราใช้คน:', '每千台定编:', 'MP Rate:'],
  ['MP / 1,000 คัน', 'MP / 1,000 台', 'MP / 1,000 units'],
  ['สัดส่วน:', '占比:', 'Mix:'],
  ['ใช้คน ~', '需定编 ~', 'Uses ~'],
  ['ตั้งต้น:', '基准:', 'Base:'],
  ['ตั้งต้น 0%', '基准 0%', 'Base 0%'],
  ['ตั้งต้น', '基准', 'Base'],
  ['เท่าเดิม (0)', '不变 (0)', 'No Change (0)'],
  ['จำลองปรับ Volume', '模拟调整产量', 'Simulate Volume'],
  ['กำลังคนมาตรฐานรวม', '标准定编人数合计', 'Total Standard Manpower'],
  ['ยอดคำสั่งผลิต', '订单产量', 'Order Volume'],
  ['สถานีคอขวดสูงสุด', '最高定编瓶颈工段', 'Top Bottleneck Station'],
  ['เพิ่มสถานีงาน', '新增工段', 'Add Station'],
  ['คืนค่าเริ่มต้นโรงงาน', '恢复工厂初始数据', 'Reset Factory Defaults'],
  ['แผนก', '部门', 'Dept'],
  ['สัปดาห์', '周次', 'Week'],
  ['สถานี', '个工段', 'Stations'],
  ['คัน/ชม.', '台/小时', 'units/hr'],
  ['คัน/เดือน', '台/月', 'units/mo'],
  ['คัน / ปี', '台/年', 'units/yr'],
  ['MP / เดือน', 'MP / 月', 'MP / mo'],
  ['คน', '人', 'MP'],
  ['คัน', '台', 'units'],
  ['ชม.', '小时', 'hrs'],
];

function translateString(input: string, lang: Language): string {
  if (lang === 'th' || !input) return input;
  let out = input;
  const targetIdx = lang === 'zh' ? 1 : 2;
  for (const entry of PHRASE_DICTIONARY) {
    const thPhrase = entry[0];
    if (out.includes(thPhrase)) {
      out = out.split(thPhrase).join(entry[targetIdx]);
    }
  }
  return out;
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | undefined>(
  undefined
);

export const AppPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG) as Language | null;
      if (saved === 'th' || saved === 'zh' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'th';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'industrial') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch {
      // ignore
    }
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // ignore
    }
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-industrial');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // Automatic DOM Text & Attribute Localizer so every nested table/chart/label translates seamlessly
  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;

    let isApplying = false;

    const processDOM = () => {
      if (isApplying) return;
      isApplying = true;
      try {
        const walker = document.createTreeWalker(
          rootEl,
          NodeFilter.SHOW_TEXT,
          null
        );
        let node = walker.nextNode() as (Text & { __origTh?: string; __lastOut?: string }) | null;
        while (node) {
          const currentVal = node.nodeValue || '';
          if (currentVal.trim().length > 0) {
            if (node.__origTh === undefined) {
              node.__origTh = currentVal;
            } else if (language === 'th' && currentVal !== node.__lastOut) {
              // Dynamic value updated while in Thai
              node.__origTh = currentVal;
            } else if (language !== 'th' && currentVal !== node.__lastOut) {
              // React updated text node with fresh Thai base string
              node.__origTh = currentVal;
            }

            const targetText =
              language === 'th'
                ? node.__origTh
                : translateString(node.__origTh, language);

            if (node.nodeValue !== targetText) {
              node.nodeValue = targetText;
            }
            node.__lastOut = targetText;
          }
          node = walker.nextNode() as (Text & { __origTh?: string; __lastOut?: string }) | null;
        }
      } finally {
        isApplying = false;
      }
    };

    processDOM();

    const observer = new MutationObserver(() => {
      if (!isApplying) {
        processDOM();
      }
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language]);

  const t = (th: string, zh: string, en: string): string => {
    if (language === 'zh') return zh;
    if (language === 'en') return en;
    return th;
  };

  const localizeStationDesc = (stationName: string, fallbackThai: string): string => {
    if (language === 'th') return fallbackThai;
    const entry = STATION_TRANSLATIONS[stationName];
    if (!entry) return translateString(fallbackThai, language);
    return language === 'zh' ? entry.zh : entry.en;
  };

  const localizeModelDesc = (modelId: string, fallbackThai: string): string => {
    if (language === 'th') return fallbackThai;
    const entry = MODEL_TRANSLATIONS[modelId];
    if (!entry) return translateString(fallbackThai, language);
    return language === 'zh' ? entry.zh : entry.en;
  };

  const localizeMonth = (monthKey: MonthKey) => {
    const meta = MONTHS.find((m) => m.key === monthKey) || MONTHS[0];
    if (language === 'zh') {
      return {
        short: meta.cnName,
        full: `${meta.cnName}`,
        sub: meta.enName,
      };
    }
    if (language === 'en') {
      return {
        short: meta.enName,
        full: `${meta.enName} (${meta.cnName})`,
        sub: meta.cnName,
      };
    }
    return {
      short: meta.shortThai,
      full: `${meta.fullThai} (${meta.cnName})`,
      sub: meta.cnName,
    };
  };

  return (
    <AppPreferencesContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        t,
        localizeStationDesc,
        localizeModelDesc,
        localizeMonth,
      }}
    >
      <div ref={containerRef} className="min-h-screen flex flex-col">
        {children}
      </div>
    </AppPreferencesContext.Provider>
  );
};

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  }
  return ctx;
}
