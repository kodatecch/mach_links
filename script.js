/* =========================================================
   MACH ONE | STEM Racing - Interactive Behaviors
   Autonomous F1 Car Track Circuit & Interactive Link Effects
   ========================================================= */

function initMachOneInteractive() {
    // Note: The autonomous F1 car track animation is natively executed via SVG <animateMotion>
    // inside index.html for maximum performance (60/120fps hardware acceleration on GPU).

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
