import { User, Post, StoryGroup, Reel, NotificationItem, ChatConversation, Comment } from '../types';

export const formatViewCount = (views?: number): string => {
  const count = views ?? 0;
  if (count >= 1_000_000) {
    const formatted = (count / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M views`;
  }
  if (count >= 1_000) {
    const formatted = (count / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}K views`;
  }
  return `${count.toLocaleString()} ${count === 1 ? 'view' : 'views'}`;
};

export const formatLikesCount = (count?: number): string => {
  const n = count ?? 0;
  if (n === 1) return '1 like';
  return `${n.toLocaleString()} likes`;
};

export const CURRENT_USER: User = {
  id: 'user_me',
  name: 'Aarav Sharma',
  username: 'aarav_sharma',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  coverImage: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&auto=format&fit=crop&q=80',
  bio: 'Visual Storyteller & Indie Musician 🇮🇳 | Exploring hidden corners of Bharat 📸 | Chai, Kodachrome & Sitar riffs ✨',
  website: 'https://loksy.app/@aarav',
  location: 'New Delhi, India',
  followersCount: 1420,
  followingCount: 489,
  postsCount: 18,
  isVerified: true,
  joinedDate: 'January 2024'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Ananya Verma',
    username: 'ananya_creates',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    bio: 'Architectural photographer & textile designer 🧵 Capturing heritage Havelis of Rajasthan 🕌',
    location: 'Jaipur, Rajasthan',
    followersCount: 18900,
    followingCount: 312,
    postsCount: 142,
    isVerified: true,
    isFollowing: true,
  },
  {
    id: 'user_2',
    name: 'Kabir Sen',
    username: 'kabir_vibes',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    bio: 'Acoustic Guitarist & Singer-Songwriter 🎸 | Next gig: Mumbai Bandra amphitheatre this Sunday 🎶',
    location: 'Mumbai, Maharashtra',
    followersCount: 34500,
    followingCount: 420,
    postsCount: 98,
    isVerified: true,
    isFollowing: true,
  },
  {
    id: 'user_3',
    name: 'Pooja Nair',
    username: 'pooja_culinary',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    bio: 'Preserving authentic regional Indian recipes 🥥 Malabar spices, heirloom grains & soulful cooking 🍲',
    location: 'Kochi, Kerala',
    followersCount: 52400,
    followingCount: 590,
    postsCount: 310,
    isVerified: true,
    isFollowing: false,
  },
  {
    id: 'user_4',
    name: 'Devendra Patel',
    username: 'dev_lensman',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    bio: 'Wildlife & Himalayan expeditioner 🏔️ Snow leopards, pangongs, and high passes 🐆',
    location: 'Leh Ladakh',
    followersCount: 12800,
    followingCount: 240,
    postsCount: 76,
    isVerified: false,
    isFollowing: true,
  },
  {
    id: 'user_5',
    name: 'Rhea Deshmukh',
    username: 'rhea_techdiaries',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    bio: 'Building AI tools from Indiranagar cafes ☕ Founder @DesiCode | Tech & startup reflections 🚀',
    location: 'Bengaluru, Karnataka',
    followersCount: 22100,
    followingCount: 410,
    postsCount: 115,
    isVerified: true,
    isFollowing: false,
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_me_1',
    userId: 'user_me',
    user: {
      id: 'user_me',
      name: 'Aarav Sharma',
      username: 'aarav_sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    caption: 'Chai at sunrise overlooking the ghats of Varanasi. The morning aarti chants floating across the mist, brass bells ringing in rhythm with the Ganga currents. Nothing cleanses the creative spirit quite like this. 🪔☕🙏 #VaranasiDiaries #IncredibleBharat #SpiritualIndia #LOKSYMoments',
    mediaUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Assi Ghat, Varanasi',
    tags: ['VaranasiDiaries', 'IncredibleBharat', 'SpiritualIndia', 'LOKSYMoments'],
    likesCount: 3412,
    commentsCount: 186,
    sharesCount: 94,
    isLiked: false,
    isSaved: true,
    createdAt: '3 hours ago',
    aspectRatio: 'square'
  },
  {
    id: 'post_me_2',
    userId: 'user_me',
    user: {
      id: 'user_me',
      name: 'Aarav Sharma',
      username: 'aarav_sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    caption: 'Tracking acoustic guitars through a vintage tube preamp in our Old Delhi studio. Pairing Indian ragas with indie folk chords. The magic happens when traditional melodies meet modern soundscapes. Track drops Friday on LOKSY! 🎸✨🎙️ #IndieMusic #DesiFusion #AaravSharma #StudioDiaries',
    mediaUrl: 'https://res.cloudinary.com/demo/video/upload/celenarae.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'video',
    location: 'Hauz Khas Village Studio, New Delhi',
    tags: ['IndieMusic', 'DesiFusion', 'AaravSharma', 'StudioDiaries'],
    likesCount: 2890,
    commentsCount: 142,
    sharesCount: 78,
    viewsCount: 12400,
    isLiked: true,
    isSaved: false,
    createdAt: '1 day ago',
    aspectRatio: 'portrait'
  },
  {
    id: 'post_me_3',
    userId: 'user_me',
    user: {
      id: 'user_me',
      name: 'Aarav Sharma',
      username: 'aarav_sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    caption: 'Street photography session through Chandni Chowk spice markets. The vivid turmeric yellows, cardamom greens, and deep chili reds under morning light. India breathes in colors that no camera can ever fully capture. 🌶️📸🇮🇳 #DelhiStreets #StreetPhotography #KodachromeVibes',
    mediaUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Chandni Chowk, Old Delhi',
    tags: ['DelhiStreets', 'StreetPhotography', 'KodachromeVibes'],
    likesCount: 4520,
    commentsCount: 215,
    sharesCount: 130,
    viewsCount: 18200,
    isLiked: true,
    isSaved: true,
    createdAt: '3 days ago',
    aspectRatio: 'landscape'
  },
  {
    id: 'post_1',
    userId: 'user_1',
    user: {
      id: 'user_1',
      name: 'Ananya Verma',
      username: 'ananya_creates',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    caption: 'Sunset hues spilling over the jharokhas of Hawa Mahal. Every arch has a story that echoes centuries of royal whispers. Which Rajasthani city has captured your soul the most? 🧡🏰✨ #JaipurDiaries #IncredibleIndia #HeritageVibes #LOKSYTravels',
    mediaUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Hawa Mahal, Pink City Jaipur',
    tags: ['JaipurDiaries', 'IncredibleIndia', 'HeritageVibes', 'LOKSYTravels'],
    likesCount: 1248,
    commentsCount: 84,
    sharesCount: 39,
    viewsCount: 8400,
    isLiked: false,
    isSaved: true,
    createdAt: '2 hours ago',
    aspectRatio: 'portrait',
    copyrightClaim: {
      id: 'claim_post_1',
      type: 'visual',
      status: 'flagged',
      visualClaimant: 'Rajasthan Tourism & Heritage Archives',
      visualDetails: 'Visual fingerprint match #4892 (Protected architectural heritage asset)',
      hasVisualWarning: true,
      detectedAt: 'Today',
    },
  },
  {
    id: 'post_2',
    userId: 'user_2',
    user: {
      id: 'user_2',
      name: 'Kabir Sen',
      username: 'kabir_vibes',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    caption: 'Late night jamming session by Marine Drive breeze. Writing a new track in pure Hindustani raag fusion. Sitar lines paired with vintage blues guitar. Audio dropping on LOKSY soon! 🌊🎸🎶 Drop your song suggestions below 👇 #IndieMusic #BombayNights #MusiciansOfLOKSY',
    mediaUrl: 'https://res.cloudinary.com/demo/video/upload/h-video.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'video',
    location: 'Marine Drive, Mumbai',
    tags: ['IndieMusic', 'BombayNights', 'MusiciansOfLOKSY'],
    likesCount: 3820,
    commentsCount: 194,
    sharesCount: 112,
    viewsCount: 28900,
    isLiked: true,
    isSaved: true,
    createdAt: '5 hours ago',
    aspectRatio: 'landscape',
    copyrightClaim: {
      id: 'claim_post_2',
      type: 'audio',
      status: 'flagged',
      audioTrack: 'Kesariya (Acoustic Folk Fusion)',
      audioArtist: 'Pritam & Arijit Singh',
      audioClaimant: 'Sony Music Entertainment India / Dharma Productions',
      audioPolicy: 'Audio muted due to copyright claim',
      isAudioMuted: true,
      detectedAt: 'Today',
    },
  },
  {
    id: 'post_3',
    userId: 'user_3',
    user: {
      id: 'user_3',
      name: 'Pooja Nair',
      username: 'pooja_culinary',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    caption: 'Morning ritual: Fresh hand-ground filter coffee in brass dabarah and steamed hot thatte idlis with roasted coconut chutney. Comfort on a rainy South Indian morning. ☕🥥🌿 Who else needs filter kaapi before talking to humans? #FilterCoffee #DesiFlavors #KeralaFoodie',
    mediaUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Fort Kochi, Kerala',
    tags: ['FilterCoffee', 'DesiFlavors', 'KeralaFoodie'],
    likesCount: 2190,
    commentsCount: 145,
    sharesCount: 67,
    isLiked: false,
    isSaved: false,
    createdAt: '8 hours ago',
    aspectRatio: 'square'
  },
  {
    id: 'post_4',
    userId: 'user_4',
    user: {
      id: 'user_4',
      name: 'Devendra Patel',
      username: 'dev_lensman',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      isVerified: false,
    },
    caption: 'Stargazing at 14,000 ft in Hanle, Ladakh. The Milky Way arching over the dark sky reserve is a humbling experience of our universe. Taken on 25s exposure. Pure silence and chilled winds. 🌌🔭✨ #Ladakh #HanleDarkSky #AstroPhotography #IncredibleBharat',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=80',
    mediaType: 'image',
    location: 'Hanle Observatory, Ladakh',
    tags: ['Ladakh', 'HanleDarkSky', 'AstroPhotography', 'IncredibleBharat'],
    likesCount: 5410,
    commentsCount: 230,
    sharesCount: 310,
    isLiked: true,
    isSaved: false,
    createdAt: '1 day ago',
    aspectRatio: 'landscape',
    isAiGenerated: true,
  }
];

export const INITIAL_STORIES: StoryGroup[] = [
  {
    userId: 'user_me',
    user: {
      id: 'user_me',
      name: 'Your Story',
      username: 'aarav_sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
    hasUnseenStories: false,
    stories: [
      {
        id: 'story_me_1',
        mediaUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Morning jamming at studio! ☕🎶',
        createdAt: '3h ago',
        duration: 5,
      }
    ]
  },
  {
    userId: 'user_1',
    user: {
      id: 'user_1',
      name: 'Ananya Verma',
      username: 'ananya_creates',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    hasUnseenStories: true,
    stories: [
      {
        id: 'story_1_1',
        mediaUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Sunrise over Amber Fort ✨ Rajasthan vibes',
        createdAt: '1h ago',
        duration: 5,
      },
      {
        id: 'story_1_2',
        mediaUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Block printing workshop in Sanganer 🎨',
        createdAt: '45m ago',
        duration: 5,
      }
    ]
  },
  {
    userId: 'user_2',
    user: {
      id: 'user_2',
      name: 'Kabir Sen',
      username: 'kabir_vibes',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    hasUnseenStories: true,
    stories: [
      {
        id: 'story_2_1',
        mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Sound check before Mumbai gig 🎸🔊',
        createdAt: '3h ago',
        duration: 5,
      }
    ]
  },
  {
    userId: 'user_3',
    user: {
      id: 'user_3',
      name: 'Pooja Nair',
      username: 'pooja_culinary',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    },
    hasUnseenStories: false,
    stories: [
      {
        id: 'story_3_1',
        mediaUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Spices from the spice plantation today 🌿 cardamom & pepper',
        createdAt: '6h ago',
        duration: 5,
      }
    ]
  },
  {
    userId: 'user_5',
    user: {
      id: 'user_5',
      name: 'Rhea Deshmukh',
      username: 'rhea_techdiaries',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    },
    hasUnseenStories: true,
    stories: [
      {
        id: 'story_5_1',
        mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
        mediaType: 'image',
        caption: 'Hackathon team shipping the new prototype at 2 AM! 💻🚀',
        createdAt: '4h ago',
        duration: 5,
      }
    ]
  }
];

export const INITIAL_REELS: Reel[] = [
  {
    id: 'reel_me_1',
    userId: 'user_me',
    user: {
      id: 'user_me',
      name: 'Aarav Sharma',
      username: 'aarav_sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/celenarae.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    caption: 'Fingers on the fretboard catching midnight raag Yaman chords 🎸 Delhi rainfall outside our window. #AcousticNights #IndieBharat #AaravSharma',
    musicTitle: 'Raag Yaman Acoustic Interlude',
    musicArtist: 'Aarav Sharma',
    likesCount: 8940,
    commentsCount: 420,
    sharesCount: 1150,
    viewsCount: 34500,
    isLiked: false,
    isSaved: true,
    createdAt: '1 day ago',
  },
  {
    id: 'reel_me_2',
    userId: 'user_me',
    user: {
      id: 'user_me',
      name: 'Aarav Sharma',
      username: 'aarav_sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/walking.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'Golden hour walk across the rooftops of Jodhpur. The blue city reflecting the evening sun like a fairytale. 🏰💙 #BlueCity #JodhpurMagic #IncredibleIndia',
    musicTitle: 'Kesariya (Lofi Rework)',
    musicArtist: 'Aarav Sharma x Pritam',
    likesCount: 12100,
    commentsCount: 650,
    sharesCount: 2190,
    viewsCount: 48200,
    isLiked: true,
    isSaved: false,
    createdAt: '3 days ago',
    copyrightClaim: {
      id: 'claim_reel_me_2',
      type: 'audio',
      status: 'flagged',
      audioTrack: 'Kesariya (Acoustic Folk Fusion)',
      audioArtist: 'Pritam & Arijit Singh',
      audioClaimant: 'Sony Music Entertainment India / Dharma Productions',
      audioPolicy: 'Audio muted due to copyright claim',
      isAudioMuted: true,
      detectedAt: '3 days ago',
    },
  },
  {
    id: 'reel_1',
    userId: 'user_1',
    user: {
      id: 'user_1',
      name: 'Ananya Verma',
      username: 'ananya_creates',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/h-video.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    caption: 'Handcrafting terracotta pottery in the alleys of Kumbharwada. 🏺 Watching clay take form is pure therapeutic poetry. #DesiCrafts #PotteryArt #IndianArtisans',
    musicTitle: 'Chaudhary (Rajasthani Folk Fusion)',
    musicArtist: 'Mame Khan & Amit Trivedi',
    likesCount: 14520,
    commentsCount: 680,
    sharesCount: 2310,
    viewsCount: 56900,
    isLiked: false,
    isSaved: false,
    createdAt: '1 day ago',
    isAiGenerated: true,
  },
  {
    id: 'reel_2',
    userId: 'user_2',
    user: {
      id: 'user_2',
      name: 'Kabir Sen',
      username: 'kabir_vibes',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/rafting.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    caption: 'When the whole crowd sings back your chorus word-for-word in Bandra! Unbelievable energy tonight Mumbai ❤️🔥 #LiveGig #AcousticSessions #BombayNights',
    musicTitle: 'Iktara (Unplugged Sunset Remix)',
    musicArtist: 'Kabir Sen feat. Tochi Raina',
    likesCount: 38900,
    commentsCount: 1240,
    sharesCount: 5400,
    viewsCount: 125000,
    isLiked: true,
    isSaved: true,
    createdAt: '2 days ago',
  },
  {
    id: 'reel_3',
    userId: 'user_4',
    user: {
      id: 'user_4',
      name: 'Devendra Patel',
      username: 'dev_lensman',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      isVerified: false,
    },
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ski_jump.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'Crossing the highest motorable road in the world: Umling La at 19,024 ft. Thin air, frozen wind, and pure exhilaration 🏍️❄️ #LadakhTrip #UmlingLa #RidersOfIndia',
    musicTitle: 'Pahadi Breeze (Flute Ambient)',
    musicArtist: 'Rakesh Chaurasia Ensemble',
    likesCount: 28400,
    commentsCount: 890,
    sharesCount: 3100,
    viewsCount: 89400,
    isLiked: false,
    isSaved: false,
    createdAt: '3 days ago',
  },
  {
    id: 'reel_4',
    userId: 'user_3',
    user: {
      id: 'user_3',
      name: 'Pooja Nair',
      username: 'pooja_culinary',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    caption: 'Secret spice blend for authentic Malabar Pepper Curry 🍛 The aroma that takes you straight back home to Kerala! #SouthIndianFood #MalabarVibes #ChefDiaries',
    musicTitle: 'Jimikki Kammal (Acoustic Folk Beat)',
    musicArtist: 'Vineeth Sreenivasan & Shaan',
    likesCount: 34200,
    commentsCount: 1120,
    sharesCount: 4210,
    viewsCount: 112000,
    isLiked: false,
    isSaved: false,
    createdAt: '4 days ago',
  },
  {
    id: 'reel_5',
    userId: 'user_5',
    user: {
      id: 'user_5',
      name: 'Rhea Deshmukh',
      username: 'rhea_techdiaries',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
    },
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    caption: 'Building next-gen AI tools from a rooftop cafe in Koramangala Bengaluru ☕💻 Startup grind never felt this energizing. #BengaluruTech #BuildInPublic #AIInnovation',
    musicTitle: 'Bangalore Days (Chill Lofi Edit)',
    musicArtist: 'Gopi Sundar & Lofi Junction',
    likesCount: 19800,
    commentsCount: 540,
    sharesCount: 1980,
    viewsCount: 67300,
    isLiked: true,
    isSaved: false,
    createdAt: '5 days ago',
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    type: 'like',
    actor: {
      id: 'user_1',
      name: 'Ananya Verma',
      username: 'ananya_creates',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    targetId: 'post_1',
    previewMediaUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&auto=format&fit=crop&q=80',
    text: 'liked your photography post from Delhi',
    createdAt: '12m ago',
    isRead: false,
  },
  {
    id: 'notif_2',
    type: 'comment',
    actor: {
      id: 'user_2',
      name: 'Kabir Sen',
      username: 'kabir_vibes',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    targetId: 'post_2',
    previewMediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    text: 'commented: "Bhai that acoustic riff was so soulful! Let us jam together next weekend."',
    createdAt: '45m ago',
    isRead: false,
  },
  {
    id: 'notif_3',
    type: 'follow',
    actor: {
      id: 'user_3',
      name: 'Pooja Nair',
      username: 'pooja_culinary',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    },
    text: 'started following you on LOKSY',
    createdAt: '2h ago',
    isRead: true,
  },
  {
    id: 'notif_4',
    type: 'message',
    actor: {
      id: 'user_5',
      name: 'Rhea Deshmukh',
      username: 'rhea_techdiaries',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    },
    text: 'sent you a message in DMs',
    createdAt: '5h ago',
    isRead: true,
  }
];

export const INITIAL_CHATS: ChatConversation[] = [
  {
    id: 'chat_1',
    participant: {
      id: 'user_1',
      name: 'Ananya Verma',
      username: 'ananya_creates',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      isOnline: true,
      lastSeen: 'Active now',
    },
    lastMessage: {
      text: 'Hey Aarav! Loved your recent shots from Old Delhi. Are you visiting Jaipur next month?',
      createdAt: '18:42',
      isSenderMe: false,
    },
    unreadCount: 1,
    messages: [
      {
        id: 'msg_1',
        senderId: 'user_1',
        text: 'Namaste Aarav! How is Delhi weather right now?',
        createdAt: '18:30',
        isRead: true,
      },
      {
        id: 'msg_2',
        senderId: 'user_me',
        text: 'Namaste Ananya! It is breezy evening here, just had some adrak chai ☕',
        createdAt: '18:35',
        isRead: true,
      },
      {
        id: 'msg_3',
        senderId: 'user_1',
        text: 'Hey Aarav! Loved your recent shots from Old Delhi. Are you visiting Jaipur next month?',
        createdAt: '18:42',
        isRead: false,
      }
    ]
  },
  {
    id: 'chat_2',
    participant: {
      id: 'user_2',
      name: 'Kabir Sen',
      username: 'kabir_vibes',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      isOnline: true,
      lastSeen: 'Active now',
    },
    lastMessage: {
      text: 'Bhai, sent you the audio draft on email as well!',
      createdAt: 'Yesterday',
      isSenderMe: false,
    },
    unreadCount: 0,
    messages: [
      {
        id: 'msg_k1',
        senderId: 'user_2',
        text: 'Yo Aarav! That sitar piece you uploaded on LOKSY was unreal.',
        createdAt: '14:20',
        isRead: true,
      },
      {
        id: 'msg_k2',
        senderId: 'user_me',
        text: 'Thanks Kabir bhai! Took 3 takes to get the tempo right haha.',
        createdAt: '14:25',
        isRead: true,
      },
      {
        id: 'msg_k3',
        senderId: 'user_2',
        text: 'Bhai, sent you the audio draft on email as well!',
        createdAt: 'Yesterday',
        isRead: true,
      }
    ]
  },
  {
    id: 'chat_3',
    participant: {
      id: 'user_5',
      name: 'Rhea Deshmukh',
      username: 'rhea_techdiaries',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      isOnline: false,
      lastSeen: '2 hours ago',
    },
    lastMessage: {
      text: 'Sounds great, let us sync during weekend!',
      createdAt: '2 days ago',
      isSenderMe: true,
    },
    unreadCount: 0,
    messages: [
      {
        id: 'msg_r1',
        senderId: 'user_5',
        text: 'Hi! Are you speaking at the creators summit in Bangalore?',
        createdAt: '2 days ago',
        isRead: true,
      },
      {
        id: 'msg_r2',
        senderId: 'user_me',
        text: 'Sounds great, let us sync during weekend!',
        createdAt: '2 days ago',
        isRead: true,
      }
    ]
  }
];

export const INITIAL_COMMENTS: Record<string, Comment[]> = {
  post_1: [
    {
      id: 'c_1',
      postId: 'post_1',
      userId: 'user_2',
      user: {
        name: 'Kabir Sen',
        username: 'kabir_vibes',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      },
      text: 'The symmetry and warm tones in this shot are extraordinary Ananya! 😍🙌',
      createdAt: '1h ago',
      likesCount: 18,
      isLiked: false,
    },
    {
      id: 'c_2',
      postId: 'post_1',
      userId: 'user_3',
      user: {
        name: 'Pooja Nair',
        username: 'pooja_culinary',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      },
      text: 'Missing Jaipur street pyaaz kachoris after seeing this! What a lovely capture 🧡',
      createdAt: '30m ago',
      likesCount: 7,
      isLiked: true,
    }
  ],
  post_2: [
    {
      id: 'c_3',
      postId: 'post_2',
      userId: 'user_1',
      user: {
        name: 'Ananya Verma',
        username: 'ananya_creates',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      },
      text: 'Cannot wait for the full track release! Marine Drive vibes are unmatched 🌊🎵',
      createdAt: '3h ago',
      likesCount: 32,
      isLiked: true,
    }
  ]
};

export const TRENDING_TAGS = [
  { tag: '#DesiCreatives', count: '142K posts' },
  { tag: '#JaipurDiaries', count: '89K posts' },
  { tag: '#IndianIndieMusic', count: '64K posts' },
  { tag: '#VaranasiGhats', count: '112K posts' },
  { tag: '#ChaiAndChill', count: '230K posts' },
  { tag: '#BangaloreStartups', count: '45K posts' },
  { tag: '#KeralaBackwaters', count: '78K posts' },
  { tag: '#StreetFoodOfIndia', count: '190K posts' }
];

export const EXPLORE_MEDIA = [
  { id: 'exp_1', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=80', type: 'image', likes: '12.4K', comments: '342' },
  { id: 'exp_2', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80', type: 'video', likes: '38.9K', comments: '1.2K' },
  { id: 'exp_3', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', type: 'image', likes: '8.7K', comments: '189' },
  { id: 'exp_4', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80', type: 'image', likes: '24.1K', comments: '890' },
  { id: 'exp_5', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80', type: 'video', likes: '14.5K', comments: '420' },
  { id: 'exp_6', url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&auto=format&fit=crop&q=80', type: 'image', likes: '5.2K', comments: '94' },
  { id: 'exp_7', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80', type: 'image', likes: '19.8K', comments: '512' },
  { id: 'exp_8', url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&auto=format&fit=crop&q=80', type: 'image', likes: '11.3K', comments: '264' },
  { id: 'exp_9', url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600&auto=format&fit=crop&q=80', type: 'image', likes: '9.4K', comments: '173' },
];
