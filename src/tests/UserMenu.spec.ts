import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserMenu from '@/layouts/UserMenu.vue';

function mountUserMenu(displayName = 'Ada Lovelace') {
  return mount(UserMenu, {
    props: {
      displayName,
      initials: 'AL'
    }
  });
}

function findButtonByText(wrapper: ReturnType<typeof mountUserMenu>, text: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === text);

  expect(button).toBeTruthy();

  return button;
}

describe('UserMenu', () => {
  it('renders the current user identity and keeps menu actions collapsed initially', () => {
    const wrapper = mountUserMenu();

    expect(wrapper.text()).toContain('Ada Lovelace');
    expect(wrapper.text()).not.toContain('Signed in as');
    expect(wrapper.find('[aria-haspopup="true"]').attributes('aria-expanded')).toBe('false');
  });

  it('opens the dropdown and emits selected menu actions', async () => {
    const wrapper = mountUserMenu();

    await wrapper.find('[aria-haspopup="true"]').trigger('click');

    expect(wrapper.find('[aria-haspopup="true"]').attributes('aria-expanded')).toBe('true');
    expect(wrapper.text()).toContain('Signed in as');
    expect(wrapper.text()).toContain('Moodboard');
    expect(wrapper.text()).toContain('Log out');

    await findButtonByText(wrapper, 'Moodboard')?.trigger('click');
    await wrapper.find('[aria-haspopup="true"]').trigger('click');
    await findButtonByText(wrapper, 'Log out')?.trigger('click');

    expect(wrapper.emitted('moodboard')).toHaveLength(1);
    expect(wrapper.emitted('logout')).toHaveLength(1);
  });

  it('closes the dropdown after selecting an action', async () => {
    const wrapper = mountUserMenu();

    await wrapper.find('[aria-haspopup="true"]').trigger('click');
    await findButtonByText(wrapper, 'Moodboard')?.trigger('click');

    expect(wrapper.find('[aria-haspopup="true"]').attributes('aria-expanded')).toBe('false');
    expect(wrapper.text()).not.toContain('Signed in as');
  });

  it('emits styleDna when the Style DNA item is clicked', async () => {
    const wrapper = mountUserMenu();
    await wrapper.find('[aria-haspopup="true"]').trigger('click');

    expect(wrapper.text()).toContain('Style DNA');
    await findButtonByText(wrapper, 'Style DNA')?.trigger('click');

    expect(wrapper.emitted('styleDna')).toHaveLength(1);
  });
});
