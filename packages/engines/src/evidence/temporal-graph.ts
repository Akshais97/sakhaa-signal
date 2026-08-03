export type TrackRole = 
  | "HOOK_OPENING"
  | "SHOT_CUT"
  | "TEXT_OVERLAY"
  | "TRANSCRIPT_WORD"
  | "AUDIO_SOUNDSCAPE"
  | "BRAND_LOGO"
  | "FACE"
  | "PRODUCT"
  | "OFFER"
  | "CTA";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EvidenceObservation {
  id: string;
  timestampMs: number;
  endMs?: number;
  role: TrackRole;
  value: string;
  confidence: number;
  boundingBox?: BoundingBox;
  provider: string;
  metadata?: Record<string, any>;
}

export interface EvidenceTrack {
  trackId: string;
  role: TrackRole;
  startMs: number;
  endMs: number;
  summaryValue: string;
  observations: EvidenceObservation[];
  dwellMs: number;
}

export class TemporalEvidenceGraph {
  private tracks: EvidenceTrack[] = [];
  private totalDurationMs: number = 0;

  constructor(totalDurationMs: number = 15000) {
    this.totalDurationMs = totalDurationMs;
  }

  public addObservation(obs: EvidenceObservation) {
    const endMs = obs.endMs ?? obs.timestampMs + 500;
    
    let track = this.tracks.find(
      (t) => t.role === obs.role && t.summaryValue.trim().toLowerCase() === obs.value.trim().toLowerCase()
    );

    if (!track) {
      track = {
        trackId: `track_${obs.role.toLowerCase()}_${this.tracks.length + 1}`,
        role: obs.role,
        startMs: obs.timestampMs,
        endMs,
        summaryValue: obs.value,
        observations: [],
        dwellMs: Math.max(100, endMs - obs.timestampMs),
      };
      this.tracks.push(track);
    } else {
      track.startMs = Math.min(track.startMs, obs.timestampMs);
      track.endMs = Math.max(track.endMs, endMs);
      track.dwellMs = Math.max(100, track.endMs - track.startMs);
    }

    track.observations.push(obs);
  }

  public getTracksByRole(role: TrackRole): EvidenceTrack[] {
    return this.tracks.filter((t) => t.role === role);
  }

  public getObservationsInInterval(startMs: number, endMs: number): EvidenceObservation[] {
    const results: EvidenceObservation[] = [];
    for (const track of this.tracks) {
      for (const obs of track.observations) {
        if (obs.timestampMs >= startMs && obs.timestampMs <= endMs) {
          results.push(obs);
        }
      }
    }
    return results;
  }

  public exportGraphJSON() {
    return {
      totalDurationMs: this.totalDurationMs,
      trackCount: this.tracks.length,
      tracks: this.tracks,
    };
  }
}
