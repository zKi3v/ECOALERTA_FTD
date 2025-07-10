import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, mergeMap, catchError } from 'rxjs';

interface NominatimResponse {
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  constructor(private http: HttpClient) {}

  getBoundary(name: string): Observable<any> {
    return this.http.get<NominatimResponse[]>(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=jsonv2&limit=1`
    ).pipe(
      mergeMap((response: NominatimResponse[]) => {
        if (!response || response.length === 0) {
          throw new Error('Location not found');
        }
        const result = response[0];
        return this.http.get(
          `https://nominatim.openstreetmap.org/lookup?osm_ids=R${result.osm_id}&format=geojson&polygon_geojson=1`
        );
      }),
      catchError((error) => {
        console.error('Error fetching boundary:', error);
        throw error;
      })
    );
  }
}
