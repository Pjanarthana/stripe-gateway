document.addEventListener('DOMContentLoaded', () => {
    // GSAP Animations
    gsap.from('header', {duration: 1, y: '-100%', ease: 'bounce'});
    gsap.from('section', {duration: 1, opacity: 0, stagger: 0.5});
    gsap.from('.feature', {duration: 0.5, opacity: 0, y: 50, stagger: 0.2, scrollTrigger: {
        trigger: '.feature-grid',
        start: 'top 80%'
    }});

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navUl = document.querySelector('nav ul');

    if (menuToggle && navUl) {
        menuToggle.addEventListener('click', () => {
            navUl.classList.toggle('show');
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Testimonial slider
    const testimonialSlider = document.querySelector('.testimonial-slider');
    if (testimonialSlider) {
        let isDown = false;
        let startX;
        let scrollLeft;

        testimonialSlider.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - testimonialSlider.offsetLeft;
            scrollLeft = testimonialSlider.scrollLeft;
        });

        testimonialSlider.addEventListener('mouseleave', () => {
            isDown = false;
        });

        testimonialSlider.addEventListener('mouseup', () => {
            isDown = false;
        });

        testimonialSlider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - testimonialSlider.offsetLeft;
            const walk = (x - startX) * 3;
            testimonialSlider.scrollLeft = scrollLeft - walk;
        });
    }

    
 // Stripe integration for payment
// Stripe integration for payment
let stripe, elements, cardElement;

try {
    stripe = Stripe('pk_test_51PiAjySGH1xnx1dJCURduDJms6Vp7BycGT4ktFJUEjUJnV2GtXfGWFm2X89PQdvKFLGcwKAcfXx6Xxv2EaU38dLH00gZUFHCKi');
    elements = stripe.elements();
    cardElement = elements.create('card');
    cardElement.mount('#card-element');
} catch (error) {
    console.error('Error initializing Stripe:', error);
    displayError('Unable to load payment system. Please try again later.');
}

const purchaseForm = document.getElementById('purchase-form');
const cardErrors = document.getElementById('card-errors');
const submitButton = purchaseForm?.querySelector('button[type="submit"]');

if (purchaseForm && stripe && elements) {
    purchaseForm.addEventListener('submit', handlePurchaseSubmit);
}

async function handlePurchaseSubmit(e) {
    e.preventDefault();
    
    if (!submitButton) return;

    disableSubmitButton();

    try {
        const hcaptchaResponse = await verifyHCaptcha();
        if (!hcaptchaResponse.success) {
            throw new Error('hCaptcha verification failed. Please try again.');
        }

        const {token, error} = await stripe.createToken(cardElement);

        if (error) {
            throw new Error(error.message);
        }

        const response = await sendPaymentToServer(token.id, hcaptchaResponse.token);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Payment failed');
        }

        const responseData = await response.json();
        handleSuccessfulPayment(responseData);
    } catch (err) {
        handlePaymentError(err);
    } finally {
        enableSubmitButton();
    }
}

async function verifyHCaptcha() {
    try {
        const token = await hcaptcha.execute();
        return { success: true, token: token };
    } catch (error) {
        console.error('hCaptcha error:', error);
        return { success: false, error: error };
    }
}

async function sendPaymentToServer(tokenId, hcaptchaToken) {
    const response = await fetch('/charge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({token: tokenId, hcaptcha: hcaptchaToken})
    });

    if (response.status === 405) {
        throw new Error('The server does not allow this type of request. Please ensure the server is configured to accept POST requests.');
    }

    return response;
}

function handleSuccessfulPayment(responseData) {
    console.log('Payment successful:', responseData);
    clearError();
    alert('Payment successful!');
    purchaseForm.reset();
}

function handlePaymentError(err) {
    console.error('Payment error:', err);
    displayError(err.message);
}

function displayError(message) {
    if (cardErrors) {
        cardErrors.textContent = message;
        cardErrors.style.display = 'block';
    }
}

function clearError() {
    if (cardErrors) {
        cardErrors.textContent = '';
        cardErrors.style.display = 'none';
    }
}

function disableSubmitButton() {
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
    }
}

function enableSubmitButton() {
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Purchase Now';
    }
}
    
    if (purchaseForm && stripe && elements) {
        purchaseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!submitButton) return;

            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';

            try {
                const hcaptchaResponse = await verifyHCaptcha();
                if (!hcaptchaResponse.success) {
                    throw new Error(`hCaptcha verification failed: ${JSON.stringify(hcaptchaResponse)}`);
                }

                const {token, error} = await stripe.createToken(cardElement);

                if (error) {
                    throw new Error(`Stripe token error: ${error.message}`);
                }

                const response = await fetch('/charge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({token: token.id, hcaptcha: hcaptchaResponse.token})
                });

                if (response.status === 405) {
                    throw new Error('Server configuration error: POST method not allowed');
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Payment failed: ${errorData.message || 'Unknown error'}`);
                }

                const responseData = await response.json();
                console.log('Payment successful:', responseData);

                if (cardErrors) {
                    cardErrors.textContent = '';
                    cardErrors.style.display = 'none';
                }
                alert('Payment successful!');
                purchaseForm.reset();
            } catch (err) {
                console.error('Detailed payment error:', err);
                if (cardErrors) {
                    cardErrors.textContent = err.message;
                    cardErrors.style.display = 'block';
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Purchase Now';
            }
        });
    }

    

    // Newsletter form submission
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;

            // Here you would typically send this to your server
            console.log(`Subscribing email: ${email}`);
            alert('Thank you for subscribing to our newsletter!');
            newsletterForm.reset();
        });
    }

    // Image zoom functionality
    const productImage = document.querySelector('.product-image-large');
    if (productImage) {
        productImage.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = e.target.getBoundingClientRect();
            const x = (e.clientX - left) / width * 100;
            const y = (e.clientY - top) / height * 100;
            productImage.style.transformOrigin = `${x}% ${y}%`;
        });

        productImage.addEventListener('mouseenter', () => {
            productImage.style.transform = 'scale(1.5)';
        });

        productImage.addEventListener('mouseleave', () => {
            productImage.style.transform = 'scale(1)';
        });
    }
});