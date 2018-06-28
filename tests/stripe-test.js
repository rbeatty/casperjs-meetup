// Setup CasperJS options
casper.options.viewportSize = {width: 1414, height: 805};

// A function to be called when an "error" level event occurs
casper.on('page.error', function(msg, trace) {
	this.echo('Error: ' + msg, 'ERROR');
	for(var i = 0; i < trace.length; i++) {
		var step = trace[i];
		this.echo(step.file + ' (line ' + step.line + ')', 'ERROR');
	}
});

// Define test
casper.test.begin('Stripe checkout test', function(test) {

	// Start test on URL
	casper.start('http://localhost/casperjs-meetup/', function() {
		casper.waitForSelector('body', function success() {
			test.assertExists('body');
			casper.capture('stripe-test/screenshots/0-loaded.jpg');
		}, function fail() {
			test.fail('Error loading page');
		});
	});

	// Get the title
	casper.then(function() {
		casper.waitForSelector('h1', function success() {
			test.assertSelectorHasText('h1', 'The Casper Mattress');
			this.echo('Product: ' + this.fetchText('h1'));
		}, function fail() {
			test.fail('No product title');
		});
	});

	// Wait for Stripe checkout button to load
	casper.then(function() {
		casper.waitForSelector('.stripe-button-el', function success() {
			this.echo('Buy button visible, clicking.');
			this.click('.stripe-button-el');
		}, function fail() {
			test.fail('No buy button');
		});
	});

	// Modal handling after checkout button clicked
	casper.then(function() {
		casper.waitUntilVisible('iframe.stripe_checkout_app', function success() {
			this.wait(1000, function() {
				casper.capture('stripe-test/screenshots/1-stripe-modal.jpg');
				this.echo('Stripe checkout modal open.');
			});
		}, function fail() {
			test.fail('Stripe modal did not show');
		});
	});

	// Fill form, this card should be declined
	casper.then(function() {
		this.page.switchToChildFrame(0); // focus iframe
		test.assertExists('form');
		this.echo('Filling checkout fields.');
		this.fillSelectors('form', {
			'input[type="email"]': 'beattyrandall@gmail.com',
			'input[placeholder="Card number"]': '4000 0000 0000 0002',
			'input[placeholder="MM / YY"]': '12 22',
			'input[placeholder="CVC"]': '123',
		}, false);
		casper.capture('stripe-test/screenshots/2-stripe-modal.jpg');

		this.wait(1000, function() {
			this.click('button[type="submit"]'); // Submit the form
			this.wait(1500, function() { // wait for response
				casper.capture('stripe-test/screenshots/3-stripe-modal.jpg');
				this.echo('Declined, switching card number.');
			});
		});
	});

	// Change card number, this card should succeed
	casper.then(function() {
		this.fillSelectors('form', {
			'input[placeholder="Card number"]': '4242 4242 4242 4242',
		}, false);

		this.wait(1000, function() { // wait for response
			this.click('button[type="submit"]'); // Submit the form
			this.wait(1500, function() {
				casper.capture('stripe-test/screenshots/4-stripe-modal.jpg');
				this.echo('Transaction approved.');
			});
		});
	});

	casper.then(function() {
		casper.waitForSelector('.stripe-button-el:disabled', function success() {
			test.assertExists('.stripe-button-el:disabled');
			this.echo('Buy button is disabled');
			casper.capture('stripe-test/screenshots/5-btn-disabled.jpg');
		}, function fail() {
			test.fail('Buy button still enabled');
		});
	});
});

// Run the test
casper.run(function() {
	casper.test.done()
});
