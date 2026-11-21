// 把每段回忆的 title / text / photos 填进对应条目即可。
// 照片示例：photos: [{ src: './assets/memories/01-a.jpg', caption: '照片说明' }]
// id 请保持不变，浏览器会用 id 保存已访问进度。
export const ROOMS = [
  { name: '花与晴天', english: 'THE SUNLIT GARDEN', color: '#e8b9b7', center: [-17, 17] },
  { name: '远方来信', english: 'LETTERS FROM AFAR', color: '#a7c9d5', center: [17, 17] },
  { name: '日常放映室', english: 'OUR EVERYDAY CINEMA', color: '#e8c980', center: [-17, -10] },
  { name: '星光收藏室', english: 'A POCKET FULL OF STARS', color: '#b9aed6', center: [17, -10] },
  { name: '心动的藏书阁', english: 'THE LITTLE LIBRARY', color: '#97bda3', center: [0, -30] },
];
export const MEMORIES = [
  { id: 1, room: 0, position: [-24, 23], title: '', text: '', photos: [] },
  { id: 2, room: 0, position: [-11, 23], title: '', text: '', photos: [] },
  { id: 3, room: 0, position: [-24, 11], title: '', text: '', photos: [] },
  { id: 4, room: 0, position: [-11, 11], title: '', text: '', photos: [] },
  { id: 5, room: 1, position: [11, 23], title: '', text: '', photos: [] },
  { id: 6, room: 1, position: [24, 23], title: '', text: '', photos: [] },
  { id: 7, room: 1, position: [11, 11], title: '', text: '', photos: [] },
  { id: 8, room: 1, position: [24, 11], title: '', text: '', photos: [] },
  { id: 9, room: 2, position: [-24, -4], title: '', text: '', photos: [] },
  { id: 10, room: 2, position: [-11, -4], title: '', text: '', photos: [] },
  { id: 11, room: 2, position: [-24, -16], title: '', text: '', photos: [] },
  { id: 12, room: 2, position: [-11, -16], title: '', text: '', photos: [] },
  { id: 13, room: 3, position: [11, -4], title: '', text: '', photos: [] },
  { id: 14, room: 3, position: [24, -4], title: '', text: '', photos: [] },
  { id: 15, room: 3, position: [11, -16], title: '', text: '', photos: [] },
  { id: 16, room: 3, position: [24, -16], title: '', text: '', photos: [] },
  { id: 17, room: 4, position: [-17, -29], title: '', text: '', photos: [] },
  { id: 18, room: 4, position: [-6, -31], title: '', text: '', photos: [] },
  { id: 19, room: 4, position: [6, -31], title: '', text: '', photos: [] },
  { id: 20, room: 4, position: [17, -29], title: '', text: '', photos: [] },
];
