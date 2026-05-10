export class AddressDto {
  id!: string;
  label!: string | null;
  line1!: string;
  line2!: string | null;
  city!: string;
  region!: string | null;
  postalCode!: string | null;
  country!: string;
  isDefault!: boolean;
}

export class AddressResponse {
  data!: AddressDto;
}

export class AddressListResponse {
  data!: AddressDto[];
}
