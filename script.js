/* =========================================================
   MACH ONE | STEM Racing - Interactive Behaviors
   Autonomous F1 Car Track Circuit & Interactive Link Effects
   ========================================================= */

function initMachOneInteractive() {
    // ---- Autonomous F1 Car driving along track circuit ----
    const trackLine = document.getElementById('f1-track-line');
    const carTrack = document.getElementById('f1-car-track');
    const trackSvg = document.getElementById('track-svg-elem');

    if (trackLine && carTrack && trackSvg) {
        const totalLength = trackLine.getTotalLength();
        let distance = 0;
        const lapDuration = 18.0; // Animação lenta e elegante: 18 segundos por volta completa
        let lastTime = performance.now();
        let currentAngle = null;

        // Responsive SVG dimension tracking without per-frame reflow
        let cachedRect = trackSvg.getBoundingClientRect();
        function updateSvgBounds() {
            const r = trackSvg.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                cachedRect = r;
            }
        }
        window.addEventListener('resize', updateSvgBounds);
        setTimeout(updateSvgBounds, 250);
        setTimeout(updateSvgBounds, 1000);

        function driveLoop(currentTime) {
            const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;

            // Advance distance smoothly along track
            distance = (distance + (totalLength / lapDuration) * deltaTime) % totalLength;

            // Point on the 729x856 SVG viewBox coordinate space
            const pt = trackLine.getPointAtLength(distance);

            // Symmetric trajectory sampling for ultra-smooth tangent calculation
            const sampleDist = 18;
            const prevDist = Math.max(0, distance - sampleDist);
            const nextDist = Math.min(totalLength, distance + sampleDist);
            const prevPt = trackLine.getPointAtLength(prevDist);
            const nextPt = trackLine.getPointAtLength(nextDist);

            const dx = nextPt.x - prevPt.x;
            const dy = nextPt.y - prevPt.y;
            // Car image faces up, so add 90 degrees to point forward
            const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

            // Smooth angular interpolation (damping steering so curves are progressive and smooth)
            if (currentAngle === null) {
                currentAngle = targetAngle;
            } else {
                let diff = targetAngle - currentAngle;
                while (diff < -180) diff += 360;
                while (diff > 180) diff -= 360;
                const steeringDamping = 6.5; // Natural, progressive steering at slow cruising speed
                currentAngle += diff * Math.min(1, deltaTime * steeringDamping);
            }

            // Scaled pixel coordinates matching current rendered SVG size
            const scaleX = cachedRect.width > 0 ? cachedRect.width / 729.001 : 1;
            const scaleY = cachedRect.height > 0 ? cachedRect.height / 856.314 : 1;

            const posX = pt.x * scaleX;
            const posY = pt.y * scaleY;

            carTrack.style.transform = `translate(${posX.toFixed(1)}px, ${posY.toFixed(1)}px) translate(-50%, -50%) rotate(${currentAngle.toFixed(1)}deg)`;
            carTrack.style.opacity = '1';

            requestAnimationFrame(driveLoop);
        }
        requestAnimationFrame(driveLoop);
    }

    // ---- Ripple & Micro-click Feedback on Link Rows ----
    const links = document.querySelectorAll('.link-item-row');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'click-ripple';
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(238, 0, 0, 0.25);
                width: 80px;
                height: 80px;
                left: ${e.clientX - rect.left - 40}px;
                top: ${e.clientY - rect.top - 40}px;
                transform: scale(0);
                animation: rippleExpand 500ms ease-out forwards;
                pointer-events: none;
                z-index: 20;
            `;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 500);
        });
    });

    // ---- Mini F1 Car Hover Exit to the Right ----
    const allLinkRows = document.querySelectorAll('.link-item-row');
    allLinkRows.forEach(row => {
        const carRunner = row.querySelector('.hover-car-runner');
        if (!carRunner) return;

        let resetTimer = null;

        row.addEventListener('mouseleave', () => {
            if (resetTimer) clearTimeout(resetTimer);

            const rowRect = row.getBoundingClientRect();
            const carRect = carRunner.getBoundingClientRect();
            const currentLeftPx = carRect.left - rowRect.left;

            // Only trigger rightward exit if the car was visible and moving across the row
            const carOpacity = window.getComputedStyle(carRunner).opacity;
            if (parseFloat(carOpacity) > 0.05 && currentLeftPx > -40) {
                // Instantly lock position so the car accelerates forward from where it is
                carRunner.style.transition = 'none';
                carRunner.style.left = `${currentLeftPx}px`;
                carRunner.style.opacity = '1';
                carRunner.offsetHeight; // Force reflow

                // Accelerate out to the right side off the button
                carRunner.style.transition = 'left 360ms cubic-bezier(0.35, 0, 0.15, 1), opacity 240ms ease 120ms';
                carRunner.style.left = 'calc(100% + 55px)';
                carRunner.style.opacity = '0';

                // Once completely off-screen, silently reset back to the left starting line
                resetTimer = setTimeout(() => {
                    carRunner.style.transition = 'none';
                    carRunner.style.left = '-46px';
                    carRunner.style.opacity = '0';
                    carRunner.offsetHeight;
                    carRunner.style.transition = '';
                    carRunner.style.left = '';
                    carRunner.style.opacity = '';
                }, 400);
            } else {
                carRunner.style.transition = '';
                carRunner.style.left = '';
                carRunner.style.opacity = '';
            }
        });

        row.addEventListener('mouseenter', () => {
            if (resetTimer) {
                clearTimeout(resetTimer);
                resetTimer = null;
                carRunner.style.transition = 'none';
                carRunner.style.left = '-38px';
                carRunner.style.opacity = '0';
                carRunner.offsetHeight;
            }
            carRunner.style.transition = '';
            carRunner.style.left = '';
            carRunner.style.opacity = '';
        });
    });

    // Inject ripple keyframes if not present
    if (!document.getElementById('mach-ripple-style')) {
        const style = document.createElement('style');
        style.id = 'mach-ripple-style';
        style.textContent = `
            @keyframes rippleExpand {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Resilient initialization across all browser loading scenarios
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMachOneInteractive);
} else {
    initMachOneInteractive();
}
