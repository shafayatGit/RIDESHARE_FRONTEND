export type Gender = "MALE" | "FEMALE";
export type AccountStatus = "ACTIVE" | "DEACTIVATED";
export type RideStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type CheckpointType = "PICKUP" | "DROP" | "STOP";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

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
  ratingCount: number;
  cancellationCount: number;
  accountStatus: AccountStatus;
  isAdmin: boolean;
  isDeleted: boolean;
}

export interface FavoriteRider {
  id: string;
  name: string;
  image?: string | null;
  isVerified: boolean;
  avgRatingAsDriver: number;
  ratingCount: number;
}

export interface Favorite {
  id: string;
  passengerId: string;
  riderId: string;
  createdAt: string;
  rider: FavoriteRider;
}

/** A review left by a passenger for a rider. Belongs to the rider, not a ride. */
export interface Rating {
  id: string;
  riderId: string;
  raterId: string;
  rating: number;
  review?: string | null;
  createdAt: string;
  updatedAt: string;
  rater?: {
    id: string;
    name: string;
    image?: string | null;
  };
}

/** One of the signed-in passenger's own ratings, with the rider's score. */
export interface MyRating extends Rating {
  rider: {
    id: string;
    name: string;
    image?: string | null;
    avgRatingAsDriver: number;
    ratingCount: number;
  };
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

/** Response shape from POST /ride/estimate. */
export type RateSource = "RIDE_AVERAGE" | "DEFAULT_PER_MILE";

export interface RideEstimate {
  distanceMiles: number;
  ratePerMile: number;
  rateSource: RateSource;
  sampleRideCount: number;
  suggestedPricePerSeat: number;
}

export interface RideDriver {
  id: string;
  name: string;
  image?: string | null;
  avgRatingAsDriver: number;
  ratingCount?: number;
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

export interface BookingCheckpoint {
  id: string;
  address: string;
  lat: number;
  lng: number;
  sequenceOrder: number;
}

export interface BookingRide {
  id: string;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  status: RideStatus;
  driver?: {
    id: string;
    name: string;
    image?: string | null;
    avgRatingAsDriver: number;
    ratingCount: number;
  };
  vehicle?: { model: string; color: string; plate: string };
}

export interface BookingPassenger {
  id: string;
  name: string;
  image?: string | null;
}

export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  pickupCheckpointId: string;
  dropCheckpointId: string;
  seatsBooked: number;
  costShareAmount: string | number;
  status: BookingStatus;
  bookingTime: string;
  cancelledById?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  ride?: BookingRide;
  passenger?: BookingPassenger;
  pickupCheckpoint?: BookingCheckpoint;
  dropCheckpoint?: BookingCheckpoint;
}
