<template>
  <svg class="timeline-orbit" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true">
    <path class="timeline-orbit__desktop" d="M 230 0 L 230 835" />
    <path
      class="timeline-orbit__desktop-arc-one"
      d="M 0 728 C 100 755 175 790 230 835 C 330 915 400 1010 435 1080"
    />
    <path class="timeline-orbit__desktop-arc-two" d="M 0 835 C 150 838 300 900 470 1080" />
  </svg>

  <svg class="mobile-orbits" viewBox="0 0 435 947" preserveAspectRatio="none" aria-hidden="true">
    <circle class="mobile-orbits__one" cx="77" cy="723" r="387" />
    <circle class="mobile-orbits__two" cx="165" cy="707" r="333" />
  </svg>

  <i class="orbit orbit--one" aria-hidden="true"></i>
  <i class="orbit orbit--two" aria-hidden="true"></i>
  <i class="star star--one" aria-hidden="true"></i>
  <i class="star star--two" aria-hidden="true"></i>
  <i class="star star--three" aria-hidden="true"></i>
  <i class="star star--four" aria-hidden="true"></i>
  <i class="star star--five" aria-hidden="true"></i>
</template>

<style scoped>
.timeline-orbit,
.mobile-orbits,
.orbit,
.star {
  position: absolute;
  z-index: 0;
}

.timeline-orbit,
.mobile-orbits {
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  animation: consultation-orbit-float 6.4s ease-in-out infinite;
}

.timeline-orbit__desktop,
.timeline-orbit__desktop-arc-one,
.timeline-orbit__desktop-arc-two {
  fill: none;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.timeline-orbit__desktop {
  stroke: #f0ede6b3;
}

.timeline-orbit__desktop-arc-one {
  stroke: #f0ede6b8;
}

.timeline-orbit__desktop-arc-two {
  stroke: #f0ede675;
}

.mobile-orbits {
  display: none;
}

.orbit {
  position: absolute;
  top: calc(50% + 32px);
  display: block;
  width: 720px;
  border-radius: 50%;
}

.orbit--one {
  right: 80px;
  height: 490px;
  border: 0.8px solid #f0ede6cc;
  transform: translateY(-48%) rotate(-33deg);
  animation: consultation-orbit-float 6.4s ease-in-out infinite;
}

.orbit--two {
  right: 77px;
  height: 435px;
  border: 1px solid #f0ede63d;
  transform: translateY(-50%) rotate(-8deg);
  animation: consultation-orbit-float 7.2s ease-in-out -1.8s infinite;
}

.star {
  position: absolute;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f0ede6eb;
  pointer-events: none;
  animation: consultation-star-float 4.4s ease-in-out infinite;
}

.star--one,
.star--four {
  width: 6px;
  height: 6px;
}

.star--one {
  left: 50%;
  top: 29%;
}

.star--two {
  left: 38%;
  top: 39%;
  animation-delay: -1.4s;
}

.star--three {
  right: 9%;
  top: 18%;
  width: 8px;
  height: 8px;
  animation-delay: -2.1s;
}

.star--four {
  left: 25%;
  bottom: 10%;
  animation-delay: -0.7s;
}

.star--five {
  right: 8%;
  bottom: 20%;
  animation-delay: -1.8s;
}

@keyframes consultation-orbit-float {
  0%,
  100% {
    translate: 0 -12px;
  }
  50% {
    translate: 0 8px;
  }
}

@keyframes consultation-star-float {
  0%,
  100% {
    translate: 0 -7px;
  }
  50% {
    translate: 0 9px;
  }
}

@media (max-width: 768px) {
  .timeline-orbit {
    display: none;
  }

  .mobile-orbits {
    display: block;
    overflow: visible;
    transform: translateY(-55px);
  }

  .mobile-orbits__one,
  .mobile-orbits__two {
    fill: none;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .mobile-orbits__one {
    stroke: #f0ede6cc;
  }

  .mobile-orbits__two {
    stroke: #f0ede642;
  }

  .orbit--one,
  .orbit--two,
  .star--three,
  .star--five {
    display: none;
  }

  .star--one {
    left: 95%;
    top: 40%;
  }

  .star--two {
    left: 20%;
    top: 97%;
  }

  .star--four {
    left: 7%;
    bottom: 5%;
  }
}
</style>
