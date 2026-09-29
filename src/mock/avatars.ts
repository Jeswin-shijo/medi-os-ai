// Portrait photos for demo people. Names without a photo fall back to a coloured
// initial avatar (the designs show both styles, e.g. "Ramesh Kumar" as a blue "R").
const unsplash = (id: string, size = 160) =>
  `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=crop&crop=faces&auto=format&q=80`;

export const DOCTOR_NAME = 'Dr. Shajin';
export const DOCTOR_AVATAR = unsplash('1612349317150-e413f6a5b16d');

const PHOTOS: Record<string, string> = {
  'Dr. Shajin': DOCTOR_AVATAR,
  'Arun Kumar': unsplash('1629425733761-caae3b5f2e50'),
  'Mary Jeni': unsplash('1607746882042-944635dfe10e'),
  'Maria Joseph': unsplash('1580489944761-15a19d654956'),
  'Antony Raj': unsplash('1633332755192-727a05c4013d'),
  'Selvi P': unsplash('1573496359142-b8d87734a5a2'),
  'Selvi A': unsplash('1544005313-94ddf0286df2'),
  'Suresh P': unsplash('1507003211169-0a1dd7228f2d'),
  'Rekha S': unsplash('1534528741775-53994a69daeb'),
  'David Raj': unsplash('1557862921-37829c790f19'),
  'James Wilson': unsplash('1472099645785-5658abf4ff4e'),
  'Latha R': unsplash('1494790108377-be9c29b29330'),
  'Latha S': unsplash('1619895862022-09114b41f16f'),
  'Daniel': unsplash('1560250097-0b93528c311a'),
  'Kumaravel': unsplash('1596075780750-81249df16d19'),
  'Anbu Raj': unsplash('1590086782792-42dd2350140d'),
  'Rajesh Kumar': unsplash('1500648767791-00dcc994a43e'),
  'Jasmine R': unsplash('1531123897727-8f129e1688ce'),
  'Dr. Priya': unsplash('1559839734-2b71ea197ec2'),
  'Dr. Ravi': unsplash('1537368910025-700350fe46c7'),
};

export const getAvatar = (name: string, size?: number): string | undefined => {
  const photo = PHOTOS[name];
  if (!photo || !size) return photo;
  return photo.replace(/w=\d+&h=\d+/, `w=${size}&h=${size}`);
};
