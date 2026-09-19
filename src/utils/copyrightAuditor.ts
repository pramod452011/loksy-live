import { CopyrightClaim } from '../types';

export interface CommercialAudioMatch {
  track: string;
  artist: string;
  claimant: string;
  policy: string;
}

export interface RoyaltyFreeAudioTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  rightsHolder: string;
  duration: string;
}

// Catalogue of commercial sound recordings recognized by Content ID
export const COMMERCIAL_AUDIO_CATALOGUE: CommercialAudioMatch[] = [
  {
    track: 'Kesariya (Acoustic Folk Fusion)',
    artist: 'Pritam & Arijit Singh',
    claimant: 'Sony Music Entertainment India / Dharma Productions',
    policy: 'Audio muted due to copyright claim',
  },
  {
    track: 'Baarishein (Monsoon Chill)',
    artist: 'Anuv Jain',
    claimant: 'Anuv Jain Records / Warner Music India',
    policy: 'Audio muted due to copyright claim',
  },
  {
    track: 'Liggi (Indie Electro Beat)',
    artist: 'Ritviz',
    claimant: 'Ritviz / Bacardi NH7 Records',
    policy: 'Audio muted due to copyright claim',
  },
  {
    track: 'Kasoor (Ukulele Live)',
    artist: 'Prateek Kuhad',
    claimant: 'Elektra Records / IPRS India',
    policy: 'Audio muted due to copyright claim',
  },
  {
    track: 'Aaftaab (Darbari Strings)',
    artist: 'The Local Train',
    claimant: 'Believe Music / The Local Train',
    policy: 'Audio muted due to copyright claim',
  },
  {
    track: 'Chaleya (Jawan Sound)',
    artist: 'Anirudh Ravichander & Arijit Singh',
    claimant: 'T-Series Music India Ltd.',
    policy: 'Audio muted due to copyright claim',
  },
  {
    track: 'Heeriye (Acoustic Duet)',
    artist: 'Jasleen Royal & Arijit Singh',
    claimant: 'Warner Music India',
    policy: 'Audio muted due to copyright claim',
  },
  {
    track: 'Lover (Punjabi Pop)',
    artist: 'Diljit Dosanjh',
    claimant: 'Famous Studios / Diljit Dosanjh',
    policy: 'Audio muted due to copyright claim',
  },
];

// Curated Royalty-Free library for "Replace Audio"
export const ROYALTY_FREE_AUDIO_LIBRARY: RoyaltyFreeAudioTrack[] = [
  {
    id: 'loksy_track_1',
    title: 'Chai & Chill Beats (Lofi)',
    artist: 'LOKSY Originals',
    genre: 'Desi Lofi',
    rightsHolder: 'LOKSY Creator Commons (Royalty-Free)',
    duration: '2:45',
  },
  {
    id: 'loksy_track_2',
    title: 'Mumbai Monsoon Beats (Hip-Hop)',
    artist: 'Desi Beat Lab',
    genre: 'Urban Folk',
    rightsHolder: 'Free Commercial Use License',
    duration: '2:12',
  },
  {
    id: 'loksy_track_3',
    title: 'Sitar Twilight (Classical Ambient)',
    artist: 'Raga Wave Collective',
    genre: 'Instrumental',
    rightsHolder: 'Public Domain / Creative Commons 0',
    duration: '3:05',
  },
  {
    id: 'loksy_track_4',
    title: 'Bengaluru Tech Pulse (Synthwave)',
    artist: 'Indie Soundscapes',
    genre: 'Electronic',
    rightsHolder: 'LOKSY Creator Commons (Royalty-Free)',
    duration: '1:58',
  },
  {
    id: 'loksy_track_5',
    title: 'Original Device Audio (Mic)',
    artist: 'Original Creator',
    genre: 'Natural Ambience',
    rightsHolder: 'Original Sound Rights (Verified)',
    duration: 'Live',
  },
];

interface AuditOptions {
  caption?: string;
  tags?: string[];
  musicTitle?: string;
  musicArtist?: string;
  mediaType?: 'image' | 'video';
  isCommercialAudio?: boolean;
  simulateTrigger?: 'audio' | 'visual' | 'both' | 'clean';
}

/**
 * Simulates a real-time background Content ID and visual fingerprint scan
 */
export function auditMediaContent(options: AuditOptions): CopyrightClaim {
  const claimId = `cid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const {
    caption = '',
    tags = [],
    musicTitle = '',
    musicArtist = '',
    mediaType = 'image',
    isCommercialAudio = false,
    simulateTrigger,
  } = options;

  // 1. Audio Check
  let matchedAudio: CommercialAudioMatch | null = null;
  const combinedAudioString = `${musicTitle} ${musicArtist}`.toLowerCase();

  // If explicitly flagged or marked commercial
  if (simulateTrigger === 'audio' || simulateTrigger === 'both' || isCommercialAudio) {
    matchedAudio =
      COMMERCIAL_AUDIO_CATALOGUE.find((t) =>
        combinedAudioString.includes(t.track.toLowerCase().slice(0, 8))
      ) || COMMERCIAL_AUDIO_CATALOGUE[0];
  } else if (mediaType === 'video' || musicTitle) {
    // Check against catalogue
    for (const item of COMMERCIAL_AUDIO_CATALOGUE) {
      if (
        combinedAudioString.includes(item.track.toLowerCase().slice(0, 8)) ||
        combinedAudioString.includes(item.artist.toLowerCase().slice(0, 8))
      ) {
        matchedAudio = item;
        break;
      }
    }

    // Check common commercial labels / keywords
    if (!matchedAudio) {
      const commercialKeywords = [
        'arijit',
        'pritam',
        't-series',
        'sony music',
        'zee music',
        'warner',
        'universal music',
        'badshah',
        'diljit',
        'ritviz',
        'yrf music',
        'shreya ghoshal',
        'anuv jain',
        'commercial',
      ];
      const hasCommercialKeyword = commercialKeywords.some((k) => combinedAudioString.includes(k));
      if (hasCommercialKeyword) {
        matchedAudio = {
          track: musicTitle || 'Commercial Sound Recording',
          artist: musicArtist || 'Commercial Artist / Label',
          claimant: 'Indian Music Rights Association (IPRS / PPL India)',
          policy: 'Audio muted due to copyright claim',
        };
      }
    }
  }

  // 2. Visual Check
  let matchedVisual = false;
  let visualClaimant = '';
  let visualDetails = '';

  const combinedVisualText = `${caption} ${tags.join(' ')}`.toLowerCase();
  const visualKeywords = [
    'disney',
    'marvel',
    'netflix',
    'paramount',
    'warner bros',
    'hbo',
    'ipl',
    'bcci',
    'icc',
    'star sports',
    'hotstar',
    'sony liv',
    'broadcast',
    'copyrighted',
  ];

  if (simulateTrigger === 'visual' || simulateTrigger === 'both') {
    matchedVisual = true;
    visualClaimant = 'Star Sports & ICC Media Rights';
    visualDetails = 'Visual broadcast fingerprint #4892 (Matches live event stream)';
  } else {
    for (const kw of visualKeywords) {
      if (combinedVisualText.includes(kw)) {
        matchedVisual = true;
        if (kw === 'ipl' || kw === 'bcci' || kw === 'icc' || kw === 'star sports') {
          visualClaimant = 'Star Sports / ICC Broadcast Media';
          visualDetails = 'Visual broadcast fingerprint #4892 (Live cricket footage)';
        } else if (kw === 'disney' || kw === 'marvel') {
          visualClaimant = 'The Walt Disney Company & Marvel Studios';
          visualDetails = 'Still image fingerprint match #9012 (Protected theatrical asset)';
        } else if (kw === 'netflix') {
          visualClaimant = 'Netflix Worldwide Entertainment LLC';
          visualDetails = 'Visual fingerprint match #7721 (Original Series asset)';
        } else {
          visualClaimant = 'Commercial Rights Holder Organization';
          visualDetails = 'Protected visual fingerprint match #6014';
        }
        break;
      }
    }
  }

  // If explicit clean request
  if (simulateTrigger === 'clean') {
    return {
      id: claimId,
      type: 'audio',
      status: 'clean',
      detectedAt: now,
    };
  }

  // 3. Compile final claim
  if (matchedAudio && matchedVisual) {
    return {
      id: claimId,
      type: 'both',
      status: 'flagged',
      audioTrack: matchedAudio.track,
      audioArtist: matchedAudio.artist,
      audioClaimant: matchedAudio.claimant,
      audioPolicy: matchedAudio.policy,
      isAudioMuted: true,
      visualClaimant,
      visualDetails,
      hasVisualWarning: true,
      detectedAt: now,
    };
  }

  if (matchedAudio) {
    return {
      id: claimId,
      type: 'audio',
      status: 'flagged',
      audioTrack: matchedAudio.track,
      audioArtist: matchedAudio.artist,
      audioClaimant: matchedAudio.claimant,
      audioPolicy: matchedAudio.policy,
      isAudioMuted: true,
      detectedAt: now,
    };
  }

  if (matchedVisual) {
    return {
      id: claimId,
      type: 'visual',
      status: 'flagged',
      visualClaimant,
      visualDetails,
      hasVisualWarning: true,
      detectedAt: now,
    };
  }

  return {
    id: claimId,
    type: 'audio',
    status: 'clean',
    detectedAt: now,
  };
}
