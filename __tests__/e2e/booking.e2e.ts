describe('Booking Flow E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete full booking flow: phone OTP → vet browse → booking → payment', async () => {
    // Phone OTP screen
    await waitFor(element(by.id('phone-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('phone-input')).typeText('+6281234567890');
    await element(by.id('send-otp-button')).multiTap();

    // OTP screen
    await waitFor(element(by.id('otp-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('otp-input')).typeText('123456');
    await element(by.id('verify-button')).multiTap();

    // Dashboard
    await waitFor(element(by.text('Browse Vets')))
      .toBeVisible()
      .withTimeout(5000);

    // Vet browse screen
    await element(by.id('browse-vets-tab')).multiTap();

    await waitFor(element(by.id('vet-list')))
      .toBeVisible()
      .withTimeout(5000);

    // Select first vet
    await element(by.id('vet-item-0')).multiTap();

    // Vet detail screen
    await waitFor(element(by.id('booking-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('booking-button')).multiTap();

    // Booking form
    await element(by.id('date-input')).typeText('2024-12-25');
    await element(by.id('time-input')).typeText('14:00');
    await element(by.id('pet-select')).multiTap();

    // Select pet
    await waitFor(element(by.text('My Dog')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.text('My Dog')).multiTap();

    // Confirm booking
    await element(by.id('confirm-booking-button')).multiTap();

    // Payment screen
    await waitFor(element(by.id('payment-info')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify payment amount shown
    await expect(element(by.text(/Rp.*/))).toBeVisible();
  });

  it('should show error on invalid OTP', async () => {
    await waitFor(element(by.id('phone-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('phone-input')).typeText('+6281234567890');
    await element(by.id('send-otp-button')).multiTap();

    await waitFor(element(by.id('otp-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('otp-input')).typeText('000000');
    await element(by.id('verify-button')).multiTap();

    // Error message should appear
    await waitFor(element(by.text(/gagal|failed|invalid/i)))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should handle network error gracefully', async () => {
    // Simulate network loss
    await device.setNetworkLoggingEnabled(false);

    await waitFor(element(by.id('phone-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('phone-input')).typeText('+6281234567890');
    await element(by.id('send-otp-button')).multiTap();

    // Should show network error
    await waitFor(element(by.text(/koneksi|network|internet/i)))
      .toBeVisible()
      .withTimeout(5000);
  });
});
