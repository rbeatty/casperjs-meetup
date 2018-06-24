// Setup CasperJS
casper.options.viewportSize = {width: 1414, height: 805};
casper.on('page.error', function(msg, trace) {
	this.echo('Error: ' + msg, 'ERROR');
	for(var i = 0; i < trace.length; i++) {
		var step = trace[i];
		this.echo(step.file + ' (line ' + step.line + ')', 'ERROR');
	}
});

casper.test.begin('Stripe checkout test', function(test) {
	// URL to run test on
	casper.start('http://localhost/casperjs/');

	// Wait for page to load
	casper.waitForSelector('body', function success() {
		casper.capture('stripe-test/screenshots/0-loaded.jpg');
	}, function fail() {
		test.assertExists('Error loading page');
	});

	// Get the title
	casper.waitForSelector('h1', function success() {
		this.echo('Product: ' + this.fetchText('h1'));
	}, function fail() {
		test.assertExists('No product title');
	});

	// Wait for Stripe checkout button to load
	casper.waitForSelector('.stripe-button-el', function success() {
		this.echo('Buy button visible, clicking...');
		this.click('.stripe-button-el');
	}, function fail() {
		test.assertExists('No buy button');
	});

	// Modal handling after checkout button clicked
	casper.waitUntilVisible('iframe.stripe_checkout_app', function success() {
		this.wait(1000, function() {
			casper.capture('stripe-test/screenshots/1-stripe-modal.jpg');
			this.echo('Stripe checkout modal open.');
			this.page.switchToChildFrame(0); // focus iframe
			this.echo('Filling checkout fields...');

			// Fill form, this card should be declined
			this.fillSelectors('form', {
				'input[type="email"]': 'beattyrandall@gmail.com',
				'input[placeholder="Card number"]': '4000 0000 0000 0002',
				'input[placeholder="MM / YY"]': '12 22',
				'input[placeholder="CVC"]': '123',
			}, false);
			this.wait(1000, function() { // wait for response
				casper.capture('stripe-test/screenshots/2-stripe-modal.jpg');
				this.echo('Submitting checkout fields...');

				// Submit the form
				this.click('button[type="submit"]');
				this.wait(1000, function() { // wait for response
					casper.capture('stripe-test/screenshots/3-stripe-modal.jpg');
					this.echo('Declined, switching card number...');

					// Change card number, this card should succeed
					this.fillSelectors('form', {
						'input[placeholder="Card number"]': '4242 4242 4242 4242',
					}, false);

					this.wait(1000, function() { // wait for response
						this.click('button[type="submit"]');
						this.wait(1500, function() {
							casper.capture('stripe-test/screenshots/4-stripe-modal.jpg');
						});
					});
				});
			});
		});
	});

	casper.run(function() {
		test.done();
	});
});
