export type Gender = "MALE" | "FEMALE";
export type AccountStatus = "ACTIVE" | "DEACTIVATED";
export type RideStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type CheckpointType = "PICKUP" | "DROP" | "STOP";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  gender: Gender;
  phoneNumber?: string | null;
  isVerified: boolean;
  avgRatingAsDriver: number;
  cancellationCount: number;
  accountStatus: AccountStatus;
  isAdmin: boolean;
  isDeleted: boolean;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  model: string;
  color: string;
  plate: string;
  seat_capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface RideCheckpoint {
  id: string;
  rideId: string;
  type: CheckpointType;
  address: string;
  lat: number;
  lng: number;
  sequenceOrder: number;
  estimatedTime?: string | null;
}

export interface RideDriver {
  id: string;
  name: string;
  image?: string | null;
  avgRatingAsDriver: number;
}

export interface Ride {
  id: string;
  driverId: string;
  vehicleId: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  departureTime: string;
  estimatedArrivalTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: string | number;
  status: RideStatus;
  isFemaleOnly: boolean;
  createdAt: string;
  updatedAt: string;
  driver?: RideDriver;
  vehicle?: Vehicle;
  checkpoints?: RideCheckpoint[];
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt?: string | null;
  sender?: { id: string; name: string };
}
