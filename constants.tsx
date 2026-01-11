
import { User, Gender } from './types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Awa',
    age: 24,
    city: 'Ouagadougou',
    district: 'Ouaga 2000',
    occupation: 'Entrepreneure Mode',
    bio: 'Passionnée par le Faso Dan Fani et la gastronomie locale. Je cherche quelqu\'un pour partager un bon poulet bicyclette ! 🇧🇫',
    interests: ['Mode', 'Cuisine', 'Voyage', 'Musique'],
    photos: ['https://picsum.photos/id/64/600/800'],
    gender: Gender.FEMALE,
  },
  {
    id: '2',
    name: 'Moussa',
    age: 28,
    city: 'Bobo-Dioulasso',
    district: 'Sarfalao',
    occupation: 'Ingénieur Agronome',
    bio: 'Fils du pays, j\'aime la terre et les traditions. Fan des Étalons et de bonne ambiance.',
    interests: ['Football', 'Nature', 'Agriculture', 'Danse'],
    photos: ['https://picsum.photos/id/91/600/800'],
    gender: Gender.MALE,
  },
  {
    id: '3',
    name: 'Sali',
    age: 22,
    city: 'Ouagadougou',
    district: 'Pissy',
    occupation: 'Étudiante en Droit',
    bio: 'Souriante et ambitieuse. J\'aime lire et découvrir de nouveaux endroits à Ouaga.',
    interests: ['Lecture', 'Droit', 'Sorties', 'Cinéma'],
    photos: ['https://picsum.photos/id/177/600/800'],
    gender: Gender.FEMALE,
  },
  {
    id: '4',
    name: 'Issouf',
    age: 30,
    city: 'Koudougou',
    district: 'Secteur 1',
    occupation: 'Commerçant',
    bio: 'Un homme simple avec de grandes valeurs. Je cherche du sérieux.',
    interests: ['Commerce', 'Famille', 'Religion', 'Radio'],
    photos: ['https://picsum.photos/id/338/600/800'],
    gender: Gender.MALE,
  },
  {
    id: '5',
    name: 'Fatima',
    age: 26,
    city: 'Ouagadougou',
    district: 'Zogona',
    occupation: 'Infirmière',
    bio: 'Prendre soin des autres est ma passion. J\'aime rire et profiter de la vie.',
    interests: ['Santé', 'Humour', 'Cuisine', 'Bénévolat'],
    photos: ['https://picsum.photos/id/453/600/800'],
    gender: Gender.FEMALE,
  }
];

export const INTERESTS_LIST = [
  'Poulet Bicyclette', 'Riz Gras', 'Faso Dan Fani', 'Football', 'Afrobeat', 'Danse Traditionnelle',
  'Voyage', 'Cinéma', 'Lecture', 'Sport', 'Entrepreneuriat', 'Cuisine', 'SIAO', 'FESPACO'
];
