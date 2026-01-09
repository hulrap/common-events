import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AddressAutocompleteValue {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  readonly value: Partial<AddressAutocompleteValue>;
  readonly onChange: (value: AddressAutocompleteValue) => void;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

/**
 * Google Places Autocomplete component for address selection
 * Automatically extracts coordinates and location details
 */
export function AddressAutocomplete({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'Search for an address...',
}: AddressAutocompleteProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value.address ?? '');

  useEffect(() => {
    if (!inputRef.current || !globalThis.google) return;

    const autocomplete = new globalThis.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: ['at'] }, // Focus on Austria (Vienna)
        fields: ['formatted_address', 'geometry', 'address_components'],
        types: ['geocode'],
      }
    );

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener(
      'place_changed',
      () => {
        const place = autocomplete.getPlace();

        if (!place.geometry?.location) {
          return;
        }

        // Extract address components
        let city = '';
        let country = '';

        if (place.address_components) {
          place.address_components.forEach(component => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('country')) {
              country = component.long_name;
            }
          });
        }

        const addressData: AddressAutocompleteValue = {
          address: place.formatted_address ?? '',
          city: city || '',
          country: country || 'Austria',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };

        setInputValue(place.formatted_address ?? '');
        onChange(addressData);
      }
    );

    return () => {
      globalThis.google?.maps.event.removeListener(listener);
    };
  }, [onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="address-autocomplete">Address *</Label>
      <Input
        ref={inputRef}
        id="address-autocomplete"
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      {!value.latitude && inputValue && (
        <p className="text-xs text-muted-foreground">
          Select an address from the dropdown to continue
        </p>
      )}
      {value.latitude && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ Address verified and geocoded</p>
          <p className="text-xs">
            {value.city}
            {value.country && `, ${value.country}`}
          </p>
        </div>
      )}
    </div>
  );
}
