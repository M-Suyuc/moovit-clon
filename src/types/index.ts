/* eslint-disable @typescript-eslint/no-explicit-any */
interface Stops {
  stop_id: string;
  stop_name: string;
  stop_desc: string;
  stop_lat: number;
  stop_lon: number;
  location_type: number;
  parent_station: string;
  stop_timezone: string;
  wheelchair_boarding: number;
  zone_id: string;
}

interface Routes {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc: string;
  route_type: number;
  coordinates: Array<{ lat: number; lon: number }> | null;
  stops: string[] | null;
}

interface FeedInfo {
  feed_publisher_name: string;
  feed_publisher_url: string;
  feed_lang: string;
  feed_start_date: any;
  feed_end_date: any;
  feed_version: any;
}

interface Trips {
  route_id: string;
  service_id: string;
  trip_id: string;
  shape_id: string;
  trip_headsign: string;
  direction_id: number;
  wheelchair_accessible: number;
}

interface StopTimes {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  pickup_type: number;
  drop_off_type: number;
}

interface Agency {
  agency_id: string;
  agency_name: string;
  agency_url: string;
  agency_timezone: string;
  agency_lang: string;
  agency_phone: string;
}

export type { Agency, Stops, Routes, FeedInfo, Trips, StopTimes };
