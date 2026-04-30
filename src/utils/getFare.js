const firstFare = 170;
const boundaries = [3, 10, 20];

const shortFare = 20;
const middleFare = 18;
const longFare = 15;

export default function getFare(distance) {
    if (!Number.isFinite(distance) || distance < 0) return null; // ありえない距離
    let result = { regular: 170, ic: 170 };
    let fare = 0;
    fare = firstFare +
        Math.min(Math.max(0, distance - boundaries[0]), boundaries[1] - boundaries[0]) * shortFare +
        Math.min(Math.max(0, distance - boundaries[1]), boundaries[2] - boundaries[1]) * middleFare +
        Math.max(0, distance - boundaries[2]) * longFare;
    while (result.regular < fare) {
        result.regular += 30;
    }
    result.ic = Math.ceil(fare);
    return result;
}