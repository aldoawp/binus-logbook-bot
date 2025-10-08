export interface ActivityData {
  activity: string;
  description: string;
}

export interface ExcelData {
  [key: string]: ActivityData;
}

export interface BotConfig {
  clockInTime: string;
  clockOutTime: string;
  excelFilePath: string;
  logbookMonth: string;
  internshipSemester: string;
}

export interface BotState {
  currentRow: number;
  totalRows: number;
  processedDates: string[];
  errors: string[];
}
