import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  canvasTextureCreated: vi.fn(),
  loadTexture: vi.fn(),
  materialDisposed: vi.fn(),
  rendererCreated: vi.fn(),
  textureDisposed: vi.fn()
}));

vi.mock('three', () => {
  class WebGLRenderer {
    capabilities = { getMaxAnisotropy: () => 1 };
    constructor() {
      mocks.rendererCreated();
    }
    setPixelRatio() {}
    setClearColor() {}
    setSize() {}
    render() {}
    dispose() {}
  }

  class PerspectiveCamera {
    aspect = 1;
    position = { set() {} };
    updateProjectionMatrix() {}
  }

  class Scene {
    add() {}
  }

  class Group {
    rotation = { x: 0, y: 0 };
    add() {}
    remove() {}
  }

  class SpriteMaterial {
    opacity = 1;
    dispose() {
      mocks.materialDisposed();
    }
  }

  class Sprite {
    userData: Record<string, unknown> = {};
    scale = { set() {} };
    position = { copy() {} };
    constructor(public material: SpriteMaterial) {}
    getWorldPosition(target: { z: number }) {
      target.z = 0;
    }
  }

  class TextureLoader {
    crossOrigin = '';
    load = mocks.loadTexture;
  }

  class Vector3 {
    z = 0;
  }

  class CanvasTexture {
    _aspect = 0;
    constructor() {
      mocks.canvasTextureCreated();
    }
    dispose() {}
  }

  return {
    CanvasTexture,
    Group,
    LinearFilter: 'LinearFilter',
    PerspectiveCamera,
    Scene,
    Sprite,
    SpriteMaterial,
    SRGBColorSpace: 'SRGBColorSpace',
    TextureLoader,
    Vector3,
    WebGLRenderer
  };
});

vi.mock('@/components/feature/moodboard/layout', () => ({
  fibSphere: () => [{ z: 0 }]
}));

import { initSphere } from '@/components/feature/moodboard/sphere';

describe('moodboard sphere textures', () => {
  beforeEach(() => {
    mocks.canvasTextureCreated.mockReset();
    mocks.loadTexture.mockReset();
    mocks.materialDisposed.mockReset();
    mocks.rendererCreated.mockReset();
    mocks.textureDisposed.mockReset();
    mocks.loadTexture.mockImplementation(
      (
        _src: string,
        onLoad: (texture: {
          image: { naturalWidth: number; naturalHeight: number };
          dispose: () => void;
        }) => void
      ) => {
        onLoad({
          image: { naturalWidth: 3, naturalHeight: 4 },
          dispose() {}
        });
      }
    );
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createLinearGradient: () => ({ addColorStop() {} }),
      fillRect() {},
      strokeRect() {}
    } as unknown as CanvasRenderingContext2D);
  });

  it('loads the default image source for a placeholder', () => {
    initSphere(
      document.createElement('canvas'),
      () => 1,
      () => false,
      [{ id: 'placeholder-1', src: '/images/image1.png', isPlaceholder: true }]
    );

    expect(mocks.loadTexture).toHaveBeenCalledWith(
      '/images/image1.png',
      expect.any(Function),
      undefined,
      expect.any(Function)
    );
    expect(mocks.canvasTextureCreated).not.toHaveBeenCalled();
  });

  it('ignores a texture that finishes loading after the sphere is disposed', () => {
    let finishLoad:
      | ((texture: {
          image: { naturalWidth: number; naturalHeight: number };
          dispose: () => void;
        }) => void)
      | undefined;
    mocks.loadTexture.mockImplementation((_src: string, onLoad: typeof finishLoad) => {
      finishLoad = onLoad;
    });
    const sphere = initSphere(
      document.createElement('canvas'),
      () => 1,
      () => false,
      [{ id: 'saved-1', src: '/saved-1.webp', isPlaceholder: false }]
    );

    sphere.dispose();
    finishLoad?.({
      image: { naturalWidth: 3, naturalHeight: 4 },
      dispose: mocks.textureDisposed
    });

    expect(mocks.textureDisposed).toHaveBeenCalledOnce();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('updates images without creating another WebGL renderer', () => {
    const sphere = initSphere(
      document.createElement('canvas'),
      () => 1,
      () => true,
      [{ id: 'saved-1', src: '/saved-1.webp', isPlaceholder: false }]
    );

    sphere.updateImages([{ id: 'saved-2', src: '/saved-2.webp', isPlaceholder: false }]);

    expect(mocks.rendererCreated).toHaveBeenCalledOnce();
    expect(mocks.loadTexture).toHaveBeenCalledTimes(2);
    expect(mocks.materialDisposed).toHaveBeenCalledOnce();
  });
});
