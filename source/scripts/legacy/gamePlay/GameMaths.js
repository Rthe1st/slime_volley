export function magnitudeXY(raw) {
    return Math.sqrt(Math.pow(raw.x, 2) + Math.pow(raw.y, 2));
}

export function normaliseXY(raw) {
    var magnitude = magnitudeXY(raw);
    return {x: raw.x / magnitude, y: raw.y / magnitude};
}

export function limitVelocity(velocity, maxSpeed){
    var magnitude = magnitudeXY(velocity);
    var normalised = normaliseXY(velocity);
    if (magnitude > maxSpeed) {
        velocity.x = maxSpeed * normalised.x;
        velocity.y = maxSpeed * normalised.y;
    }
}