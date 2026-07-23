describe('Playdate Community E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should post playdate, receive interest, and chat', async () => {
    // Login first
    await waitFor(element(by.id('phone-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('phone-input')).typeText('+6281234567890');
    await element(by.id('send-otp-button')).multiTap();

    await waitFor(element(by.id('otp-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('otp-input')).typeText('123456');
    await element(by.id('verify-button')).multiTap();

    // Navigate to playdate tab
    await waitFor(element(by.id('playdate-tab')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('playdate-tab')).multiTap();

    // Post playdate
    await waitFor(element(by.id('post-playdate-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('post-playdate-button')).multiTap();

    // Fill form
    await element(by.id('playdate-description')).typeText('Lets meet for playtime at Central Park!');
    await element(by.id('playdate-date')).typeText('2024-12-25');
    await element(by.id('playdate-pet-select')).multiTap();

    // Select pet
    await waitFor(element(by.text('My Dog')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('My Dog')).multiTap();

    // Submit
    await element(by.id('submit-playdate-button')).multiTap();

    // Verify post created
    await waitFor(element(by.text(/playtime/)))
      .toBeVisible()
      .withTimeout(5000);

    // Check for matches
    await waitFor(element(by.id('matches-tab')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('matches-tab')).multiTap();

    // Should see interested owners
    await waitFor(element(by.id('match-item-0')))
      .toBeVisible()
      .withTimeout(5000);

    // Accept match and open chat
    await element(by.id('accept-match-0')).multiTap();

    // Chat screen
    await waitFor(element(by.id('chat-input')))
      .toBeVisible()
      .withTimeout(5000);

    // Send message
    await element(by.id('chat-input')).typeText('Nice to meet you!');
    await element(by.id('chat-send-button')).multiTap();

    // Verify message sent
    await waitFor(element(by.text('Nice to meet you!')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show interested match notification', async () => {
    // Login
    await waitFor(element(by.id('phone-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('phone-input')).typeText('+6281234567890');
    await element(by.id('send-otp-button')).multiTap();

    await waitFor(element(by.id('otp-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('otp-input')).typeText('123456');
    await element(by.id('verify-button')).multiTap();

    // Check notifications
    await waitFor(element(by.id('notification-badge')))
      .toBeVisible()
      .withTimeout(5000);

    // Badge should show count
    await expect(element(by.id('notification-badge'))).toBeVisible();
  });
});
