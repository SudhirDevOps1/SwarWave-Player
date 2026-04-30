import type { Artist, Mood } from '@/types';

export const artists: Artist[] = [
  // Bollywood
  { name: 'Arijit Singh', category: 'bollywood' },
  { name: 'Shreya Ghoshal', category: 'bollywood' },
  { name: 'A.R. Rahman', category: 'bollywood' },
  { name: 'Neha Kakkar', category: 'bollywood' },
  { name: 'Jubin Nautiyal', category: 'bollywood' },
  { name: 'Atif Aslam', category: 'bollywood' },
  { name: 'Lata Mangeshkar', category: 'bollywood' },
  { name: 'Sonu Nigam', category: 'bollywood' },
  { name: 'Alka Yagnik', category: 'bollywood' },
  { name: 'Darshan Raval', category: 'bollywood' },
  { name: 'Tulsi Kumar', category: 'bollywood' },
  { name: 'Badshah', category: 'bollywood' },
  { name: 'Raftaar', category: 'bollywood' },

  // Bhojpuri
  { name: 'Pawan Singh', category: 'bhojpuri' },
  { name: 'Khesari Lal Yadav', category: 'bhojpuri' },
  { name: 'Manoj Tiwari', category: 'bhojpuri' },
  { name: 'Dinesh Lal Yadav', category: 'bhojpuri' },
  { name: 'Shilpi Raj', category: 'bhojpuri' },
  { name: 'Priyanka Singh', category: 'bhojpuri' },
  { name: 'Ritesh Pandey', category: 'bhojpuri' },

  // Punjabi
  { name: 'Diljit Dosanjh', category: 'punjabi' },
  { name: 'Sidhu Moose Wala', category: 'punjabi' },
  { name: 'Guru Randhawa', category: 'punjabi' },
  { name: 'AP Dhillon', category: 'punjabi' },
  { name: 'B Praak', category: 'punjabi' },
  { name: 'Jass Manak', category: 'punjabi' },
  { name: 'Karan Aujla', category: 'punjabi' },
  { name: 'Ammy Virk', category: 'punjabi' },
  { name: 'Harrdy Sandhu', category: 'punjabi' },
  { name: 'Satinder Sartaaj', category: 'punjabi' },

  // Haryanvi
  { name: 'Renuka Panwar', category: 'haryanvi' },
  { name: 'Sapna Choudhary', category: 'haryanvi' },
  { name: 'Ajay Hooda', category: 'haryanvi' },
  { name: 'Gajender Phogat', category: 'haryanvi' },
  { name: 'Vishvajeet Choudhary', category: 'haryanvi' },
  { name: 'Komal Chaudhary', category: 'haryanvi' },
  { name: 'Shiva Choudhary', category: 'haryanvi' },
  { name: 'Raj Mawar', category: 'haryanvi' },

  // English / Western
  { name: 'Ed Sheeran', category: 'english' },
  { name: 'Taylor Swift', category: 'english' },
  { name: 'The Weeknd', category: 'english' },
  { name: 'Dua Lipa', category: 'english' },
  { name: 'Billie Eilish', category: 'english' },
  { name: 'Adele', category: 'english' },
  { name: 'Bruno Mars', category: 'english' },
  { name: 'Justin Bieber', category: 'english' },
  { name: 'Shakira', category: 'english' },
  { name: 'Coldplay', category: 'english' },
  { name: 'Eminem', category: 'english' },
  { name: 'Drake', category: 'english' },

  // Rap / Hip-Hop
  { name: 'Yo Yo Honey Singh', category: 'rap' },
  { name: 'Emiway Bantai', category: 'rap' },
  { name: 'Divine', category: 'rap' },
  { name: 'Naezy', category: 'rap' },
  { name: 'Seedhe Maut', category: 'rap' },
  { name: 'Prabh Deep', category: 'rap' },
  { name: 'MC Stan', category: 'rap' },
  { name: 'Yo Yo Honey Singh', category: 'rap' },
  { name: 'Raftaar', category: 'rap' },
  { name: 'Badshah', category: 'rap' },

  // Legends
  { name: 'Kishore Kumar', category: 'legends' },
  { name: 'Mohammed Rafi', category: 'legends' },
  { name: 'Mukesh', category: 'legends' },
  { name: 'Asha Bhosle', category: 'legends' },
  { name: 'Manna Dey', category: 'legends' },
  { name: 'Hemant Kumar', category: 'legends' },
  { name: 'Geeta Dutt', category: 'legends' },
  { name: 'Noor Jehan', category: 'legends' },
  { name: 'Bhupen Hazarika', category: 'legends' },
];

export const moods: Mood[] = [
  { name: 'Romantic', emoji: '💕', query: 'romantic bollywood songs', color: 'from-pink-500 to-rose-500' },
  { name: 'Workout', emoji: '💪', query: 'workout motivational songs hindi', color: 'from-orange-500 to-red-500' },
  { name: 'Chill', emoji: '😌', query: 'chill relaxing hindi songs', color: 'from-blue-500 to-cyan-500' },
  { name: 'Party', emoji: '🎉', query: 'party dance bollywood songs', color: 'from-purple-500 to-pink-500' },
  { name: 'Devotional', emoji: '🙏', query: 'devotional bhajan hindi', color: 'from-yellow-500 to-orange-500' },
  { name: 'Bhojpuri', emoji: '🎭', query: 'bhojpuri hit songs', color: 'from-green-500 to-emerald-500' },
  { name: 'Punjabi', emoji: '🥁', query: 'punjabi hit songs', color: 'from-amber-500 to-yellow-500' },
  { name: 'Haryanvi', emoji: '🪘', query: 'haryanvi hit songs', color: 'from-teal-500 to-green-500' },
  { name: 'English', emoji: '🌍', query: 'english pop hits', color: 'from-cyan-500 to-blue-500' },
  { name: 'Rap', emoji: '🎤', query: 'rap hip hop hindi', color: 'from-gray-500 to-slate-500' },
  { name: 'Sad', emoji: '😢', query: 'sad emotional bollywood songs', color: 'from-indigo-500 to-blue-500' },
  { name: 'Morning', emoji: '🌅', query: 'morning peaceful hindi songs', color: 'from-orange-400 to-pink-400' },
];

export const trendingSearches = [
  'Latest Bollywood Songs 2025',
  'Arijit Singh New Songs',
  'Punjabi Top Hits',
  'Bhojpuri Hit Songs',
  'Old Hindi Songs',
  'Diljit Dosanjh',
  'AP Dhillon New Songs',
  'Ed Sheeran Songs',
  'Emiway Bantai Rap',
  'Haryanvi Dance Hits',
];
