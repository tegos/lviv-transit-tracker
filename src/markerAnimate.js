// Adds google.maps.Marker.prototype.animateTo for smooth marker movement.
// Original 2017 lib supported jQuery easing; we only ever use linear, so the
// jQuery dependency is dropped. Must run after the Maps API has loaded, so it
// is exposed as an installer and called from initMap.
export function installMarkerAnimate() {
    if (google.maps.Marker.prototype.animateTo) return;

    google.maps.Marker.prototype.animateTo = function (newPosition, options) {
        const duration = (options && options.duration) || 1000;
        const complete = options && options.complete;

        this.AT_startPosition_lat = this.getPosition().lat();
        this.AT_startPosition_lng = this.getPosition().lng();
        const newPosition_lat = newPosition.lat();
        let newPosition_lng = newPosition.lng();

        // crossing the 180° meridian and going the long way around the earth?
        if (Math.abs(newPosition_lng - this.AT_startPosition_lng) > 180) {
            newPosition_lng += newPosition_lng > this.AT_startPosition_lng ? -360 : 360;
        }

        const animateStep = (marker, startTime) => {
            const elapsed = performance.now() - startTime;
            const ratio = elapsed / duration; // 0 - 1 (linear easing)

            if (ratio < 1) {
                marker.setPosition(new google.maps.LatLng(
                    marker.AT_startPosition_lat + (newPosition_lat - marker.AT_startPosition_lat) * ratio,
                    marker.AT_startPosition_lng + (newPosition_lng - marker.AT_startPosition_lng) * ratio,
                ));
                marker.AT_animationHandler = requestAnimationFrame(() => animateStep(marker, startTime));
            } else {
                marker.setPosition(newPosition);
                if (typeof complete === 'function') complete();
            }
        };

        // stop a possibly running animation
        if (this.AT_animationHandler) cancelAnimationFrame(this.AT_animationHandler);
        animateStep(this, performance.now());
    };
}
