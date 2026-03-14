const firstFare = 170;
const boundaries = [3, 10, 20];

const shortFare = 20;
const middleFare = 18;
const longFare = 15;

export default function getFare(distance) {
    let result = { regular: 170, ic: 170 };
    let fare = 0;
    if (distance <= boundaries[0]) {
        fare = firstFare;
    } else if (distance <= boundaries[1]) {
        fare = firstFare + (distance - boundaries[0]) * shortFare;
    } else if (distance <= boundaries[2]) {
        fare = firstFare + (distance - boundaries[0]) * middleFare;
    } else {
        fare = (distance - boundaries[0]) * longFare;
    }
    while (result.regular < fare) {
        result.regular += 30;
    }
    result.ic = Math.ceil(fare);
    return result;
}