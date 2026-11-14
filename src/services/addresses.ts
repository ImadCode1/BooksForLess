import { useSyncExternalStore } from "react";

export type Address = {
  id: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

export type NewAddressInput = Omit<Address, "id">;

type State = { addresses: Address[]; defaultId: string | null };

// In-memory only: addresses are lost when the app restarts.
// TODO: store addresses on the user's account once there is a backend.
let state: State = { addresses: [], defaultId: null };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): State {
  return state;
}

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function toAddress(input: NewAddressInput): Address {
  return {
    id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fullName: input.fullName.trim(),
    street: input.street.trim(),
    city: input.city.trim(),
    postalCode: input.postalCode.trim(),
    country: input.country.trim(),
  };
}

/** Saves an address. The first address saved becomes the default. */
export function saveAddress(address: Address): void {
  setState({
    addresses: [...state.addresses, address],
    defaultId: state.defaultId ?? address.id,
  });
}

export function setDefaultAddress(id: string): void {
  if (state.addresses.some((a) => a.id === id)) setState({ ...state, defaultId: id });
}

/** Saved addresses, with the default one first. */
export function useAddresses(): { addresses: Address[]; defaultId: string | null } {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function formatAddressLine(address: Address): string {
  return `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;
}
