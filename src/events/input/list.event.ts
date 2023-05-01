export class ListEvent {
  when?: WhenEventFilter = WhenEventFilter.All;
  page?: number = 1;
  limit?: number = 10;
}

export enum WhenEventFilter {
  All = 1,
  Today = 2,
  Tomorrow = 3,
  ThisWeek = 4,
  NextWeek = 5,
}
