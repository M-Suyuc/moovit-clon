class GTFSManager {
  private agencyId: string = "";
  private stopId: string = "";
  private serviceId: string = "";
  private calendarId: string = "";

  setAgencyId(id: string) {
    this.agencyId = id;
  }
  getAgencyId(): string {
    return this.agencyId;
  }

  setStopId(id: string) {
    this.stopId = id;
  }
  getStopId(): string {
    return this.stopId;
  }

  setServiceId(id: string) {
    this.serviceId = id;
  }
  getServiceId(): string {
    return this.serviceId;
  }

  setCalendarId(id: string) {
    this.calendarId = id;
  }
  getCalendarId(): string {
    return this.calendarId;
  }
}

export const gtfs = new GTFSManager();
// 8

// export class TransitSystem {
//   private agencies: Map<string, Agency> = new Map();

//   addAgency(agency: Agency) {
//     this.agencies.set(agency.id, agency);
//   }
//   getAgency(id: string) {
//     return this.agencies.get(id);
//   }
// }

//
