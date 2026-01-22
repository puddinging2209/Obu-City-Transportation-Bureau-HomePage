export function nowsecond() {
    const now = new Date();
    return adjustTime(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
}

export function toTime(seconds) {
    if (seconds > 86400) seconds -= 86400;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return { h, m, s };
}

export function toTimeString(seconds) {
    const timeObj = toTime(Number(seconds));
    const hStr = String(timeObj.h);
    const mStr = String(timeObj.m).padStart(2, '0');
    return `${hStr}:${mStr}`;
}

export function adjustTime(seconds) {
    return (seconds < 10800) ? seconds + 86400 : seconds;
}