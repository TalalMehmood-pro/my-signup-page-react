// src/SignupPage.js
import React, { useEffect, useRef, useState } from "react";
import $ from "jquery";
import "country-select-js";
import "country-select-js/build/css/countrySelect.css";
import "./SignupPage.css";
import { createUserEmailPassword, saveUserDoc } from "./firebase";

function SignupPage() {
  // refs for DOM elements (so plugin and class-style operations work)
  const formRef = useRef(null);
  const userNameRef = useRef(null);
  const parentNameRef = useRef(null);
  const userEmailRef = useRef(null);
  const userGenderRef = useRef(null);
  const userCountryRef = useRef(null);
  const userPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const termsAcceptRef = useRef(null);

  const userNameErrorRef = useRef(null);
  const parentNameErrorRef = useRef(null);
  const userEmailErrorRef = useRef(null);
  const userGenderErrorRef = useRef(null);
  const userCountryErrorRef = useRef(null);
  const userPasswordErrorRef = useRef(null);
  const confirmPasswordErrorRef = useRef(null);
  const termsAcceptErrorRef = useRef(null);
  const passwordMatchMessageRef = useRef(null);

  const togglePasswordRef = useRef(null);
  const toggleConfirmPasswordRef = useRef(null);

  const modalRef = useRef(null);

  // local state for re-render parts (submit button disabled & status)
  const [submitting, setSubmitting] = useState(false);

  // -------------------
  // Initialize country plugin + modal outside click
  // -------------------
  useEffect(() => {
    if (userCountryRef.current) {
      $(userCountryRef.current).countrySelect({
        defaultCountry: "us",
        responsiveDropdown: true,
        preferredCountries: ["us", "gb", "ca", "au", "in"],
      });
    }

    const handleWindowClick = (ev) => {
      if (modalRef.current && ev.target === modalRef.current) {
        closeModal();
      }
    };
    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener("click", handleWindowClick);
      // try to destroy plugin on unmount
      try {
        if (userCountryRef.current) {
          $(userCountryRef.current).countrySelect("destroy");
        }
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== UI helpers =====
  function showElement(el) {
    if (el) el.classList.add("error-message-show");
  }
  function hideElement(el) {
    if (el) el.classList.remove("error-message-show");
  }

  function clearFieldValidation(field, errorEl) {
    if (!field) return;
    field.classList.remove(
      "form-input-invalid",
      "form-input-valid",
      "form-select-invalid",
      "form-select-valid"
    );
    if (errorEl) hideElement(errorEl);
  }

  function markFieldInvalid(field, errorElement, message) {
    if (!field) return;
    const isSelect = field.tagName === "SELECT";
    field.classList.add(isSelect ? "form-select-invalid" : "form-input-invalid");
    if (errorElement) {
      showElement(errorElement);
      errorElement.textContent = message;
    }
  }

  function markFieldValid(field) {
    if (!field) return;
    const isSelect = field.tagName === "SELECT";
    field.classList.add(isSelect ? "form-select-valid" : "form-input-valid");
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ===== realtime validation helpers (called from JSX events) =====
  function validateEmailRealTime() {
    const email = userEmailRef.current?.value.trim() ?? "";
    const errEl = userEmailErrorRef.current;
    if (email && !isValidEmail(email)) {
      markFieldInvalid(userEmailRef.current, errEl, "Please enter a valid email address");
    } else if (isValidEmail(email)) {
      markFieldValid(userEmailRef.current);
      hideElement(errEl);
    }
  }

  function clearFieldValidationIfValid(fieldElement, errorElement) {
    const value = fieldElement?.value?.trim?.() ?? "";
    if (!fieldElement) return;
    if (fieldElement.classList.contains("form-input-invalid") || fieldElement.classList.contains("form-select-invalid")) {
      if (value) {
        markFieldValid(fieldElement);
        hideElement(errorElement);
      }
    }
  }

  // ===== password toggle (fixed logic) =====
  function togglePasswordVisibility(inputElement, toggleButton) {
    if (!inputElement || !toggleButton) return;
    const currentType = inputElement.getAttribute("type");
    const newType = currentType === "password" ? "text" : "password";
    inputElement.setAttribute("type", newType);
    const icon = toggleButton.querySelector("i");
    // show open eye when password visible (text), closed/struck when hidden (password)
    if (icon) icon.className = newType === "password" ? "fas fa-eye-slash" : "fas fa-eye";
  }

  function resetPasswordIcons() {
    const icons = [
      togglePasswordRef.current?.querySelector("i"),
      toggleConfirmPasswordRef.current?.querySelector("i"),
    ];
    icons.forEach((icon) => {
      if (icon) icon.className = "fas fa-eye-slash";
    });
    if (userPasswordRef.current) userPasswordRef.current.setAttribute("type", "password");
    if (confirmPasswordRef.current) confirmPasswordRef.current.setAttribute("type", "password");
  }

  function checkPasswordMatch() {
    const password = userPasswordRef.current?.value ?? "";
    const confirmPassword = confirmPasswordRef.current?.value ?? "";
    const msgEl = passwordMatchMessageRef.current;
    if (!password && !confirmPassword) {
      hideElement(msgEl);
      return;
    }
    if (password && confirmPassword) {
      if (password === confirmPassword) {
        showPasswordMatchMessage("✓ Passwords match", "success");
      } else {
        showPasswordMatchMessage("✗ Passwords do not match", "error");
      }
    }
  }

  function showPasswordMatchMessage(message, type) {
    const el = passwordMatchMessageRef.current;
    if (!el) return;
    el.textContent = message;
    el.className = `password-match-message password-match-message-show password-match-message-${type}`;
  }

  // ===== modal (terms) =====
  function openModal() {
    if (modalRef.current) {
      modalRef.current.style.display = "block";
      document.body.style.overflow = "hidden";
    }
  }

  function closeModal() {
    if (modalRef.current) {
      modalRef.current.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  function acceptTerms() {
    if (termsAcceptRef.current) {
      termsAcceptRef.current.checked = true;
      validateTerms();
      closeModal();
    }
  }

  function validateTerms() {
    const checked = termsAcceptRef.current?.checked ?? false;
    const errEl = termsAcceptErrorRef.current;
    hideElement(errEl);
    if (!checked) {
      showElement(errEl);
      errEl.textContent = "You must accept the Terms and Conditions";
      return false;
    }
    return true;
  }

  // ===== core validation =====
  function validateField(field, fieldType = "text") {
    if (!field) return false;
    const fieldId = field.id;
    const value = (field.value || "").trim();
    const errorMap = {
      userName: userNameErrorRef.current,
      userEmail: userEmailErrorRef.current,
      parentName: parentNameErrorRef.current,
      userGender: userGenderErrorRef.current,
      userCountry: userCountryErrorRef.current,
      userPassword: userPasswordErrorRef.current,
      confirmPassword: confirmPasswordErrorRef.current,
    };
    const errorElement = errorMap[fieldId];

    clearFieldValidation(field, errorElement);

    if (!value) {
      markFieldInvalid(field, errorElement, "This field is required");
      return false;
    }

    if (fieldType === "email" && !isValidEmail(value)) {
      markFieldInvalid(field, errorElement, "Please enter a valid email address");
      return false;
    }

    if (fieldType === "password" && value.length < 6) {
      markFieldInvalid(field, errorElement, "Password must be at least 6 characters");
      return false;
    }

    markFieldValid(field);
    return true;
  }

  // ===== firebase create user + store doc =====
  async function createUserInFirebase(userData) {
    try {
      const uc = await createUserEmailPassword(userData.userEmail, userData.userPassword);
      const user = uc.user;
      await saveUserDoc(user.uid, {
        userName: userData.userName,
        userEmail: userData.userEmail,
        parentName: userData.parentName,
        userGender: userData.userGender,
        userCountry: userData.userCountry,
        termsAccepted: userData.termsAccepted,
      });
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message || String(err) };
    }
  }

  // ===== form collection + submit =====
  function collectFormData() {
    // get country from plugin if available
    let countryVal = userCountryRef.current?.value ?? "";
    try {
      const data = $(userCountryRef.current).countrySelect("getSelectedCountryData");
      countryVal = data?.name || countryVal;
    } catch (e) {}

    return {
      userName: userNameRef.current?.value.trim() ?? "",
      userEmail: userEmailRef.current?.value.trim() ?? "",
      parentName: parentNameRef.current?.value.trim() ?? "",
      userGender: userGenderRef.current?.value ?? "",
      userCountry: countryVal ?? "",
      userPassword: userPasswordRef.current?.value ?? "",
      confirmPassword: confirmPasswordRef.current?.value ?? "",
      termsAccepted: termsAcceptRef.current?.checked ?? false,
    };
  }

  function validateForm(formData) {
    let isValid = true;
    const fields = [
      { field: userNameRef.current, type: "text" },
      { field: userEmailRef.current, type: "email" },
      { field: parentNameRef.current, type: "text" },
      { field: userGenderRef.current, type: "select" },
      { field: userCountryRef.current, type: "text" },
      { field: userPasswordRef.current, type: "password" },
      { field: confirmPasswordRef.current, type: "password" },
    ];
    fields.forEach(({ field, type }) => {
      if (!validateField(field, type)) isValid = false;
    });

    if (!validateTerms()) isValid = false;

    if (formData.userPassword !== formData.confirmPassword) {
      isValid = false;
      showPasswordMatchMessage("✗ Passwords do not match", "error");
    }

    return isValid;
  }

  async function processFormSubmission(formData) {
    showPasswordMatchMessage("Creating account...", "success");
    const submitButton = formRef.current?.querySelector(".submit-button");
    const originalText = submitButton ? submitButton.textContent : "Create Account";
    if (submitButton) {
      submitButton.textContent = "Creating Account...";
      submitButton.disabled = true;
    }
    setSubmitting(true);

    try {
      const result = await createUserInFirebase(formData);
      if (result.success) {
        showPasswordMatchMessage("✓ Account created successfully!", "success");
        setTimeout(() => {
          resetForm();
        }, 1400);
      } else {
        handleFirebaseError(result.error || "An error occurred");
      }
    } catch (err) {
      handleFirebaseError(err.message || String(err));
    } finally {
      if (submitButton) {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
      setSubmitting(false);
    }
  }

  function handleFirebaseError(errorMessage) {
    let userFriendlyMessage = "An error occurred. Please try again.";
    if (errorMessage.includes("email-already-in-use")) {
      userFriendlyMessage = "This email is already registered. Please use a different email.";
    } else if (errorMessage.includes("weak-password")) {
      userFriendlyMessage = "Password is too weak. Please use a stronger password.";
    } else if (errorMessage.includes("network-request-failed")) {
      userFriendlyMessage = "Network error. Please check your internet connection.";
    } else if (errorMessage.includes("Firebase is still loading")) {
      userFriendlyMessage = "Firebase is still loading. Please wait a moment and try again.";
    }
    showPasswordMatchMessage(`✗ ${userFriendlyMessage}`, "error");
  }

  function resetForm() {
    formRef.current && formRef.current.reset();
    if (userCountryRef.current) {
      try {
        $(userCountryRef.current).countrySelect("setCountry", "");
      } catch (e) {
        userCountryRef.current.value = "";
      }
    }
    clearAllValidation();
    resetPasswordIcons();
    hideElement(passwordMatchMessageRef.current);
  }

  function clearAllValidation() {
    const fields = [
      userNameRef.current,
      userEmailRef.current,
      parentNameRef.current,
      userGenderRef.current,
      userCountryRef.current,
      userPasswordRef.current,
      confirmPasswordRef.current,
    ];
    fields.forEach((f) => {
      if (f) {
        f.classList.remove("form-input-invalid", "form-input-valid", "form-select-invalid", "form-select-valid");
      }
    });
    const errors = [
      userNameErrorRef.current,
      userEmailErrorRef.current,
      parentNameErrorRef.current,
      userGenderErrorRef.current,
      userCountryErrorRef.current,
      userPasswordErrorRef.current,
      confirmPasswordErrorRef.current,
      termsAcceptErrorRef.current,
    ];
    errors.forEach((e) => {
      hideElement(e);
    });
  }

  // ===== MAIN submit handler =====
  async function handleFormSubmit(event) {
    event?.preventDefault?.();
    const formData = collectFormData();
    if (validateForm(formData)) {
      await processFormSubmission(formData);
    }
  }

  // ===== JSX UI - uses your original structure and classes =====
  return (
    <>
      <div className="page-background">
        <img src="/assets/Videos/space-bg.gif" alt="Space Background" className="background-media" />
      </div>

      <main className="signup-wrapper">
        <section className="signup-card">
          <header className="signup-header">
            <h1 className="signup-title">Create Your Account</h1>
          </header>

          <form className="signup-form" id="SignupForm" ref={formRef} onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="userName" className="form-label">Full Name</label>
              <input type="text" id="userName" name="userName" className="form-input" ref={userNameRef}
                onInput={() => clearFieldValidationIfValid(userNameRef.current, userNameErrorRef.current)} />
              <div className="error-message" id="userNameError" ref={userNameErrorRef}></div>
            </div>

            <div className="form-group">
              <label htmlFor="parentName" className="form-label">Parent Name</label>
              <input type="text" id="parentName" name="parentName" className="form-input" ref={parentNameRef}
                onInput={() => clearFieldValidationIfValid(parentNameRef.current, parentNameErrorRef.current)} />
              <div className="error-message" id="parentNameError" ref={parentNameErrorRef}></div>
            </div>

            <div className="form-group">
              <label htmlFor="userEmail" className="form-label">Email Address</label>
              <input type="email" id="userEmail" name="userEmail" className="form-input" ref={userEmailRef}
                onInput={validateEmailRealTime} onBlur={validateEmailRealTime} />
              <div className="error-message" id="userEmailError" ref={userEmailErrorRef}></div>
            </div>

            <div className="form-group">
              <label htmlFor="userGender" className="form-label">Gender</label>
              <select id="userGender" name="userGender" className="form-select" ref={userGenderRef}
                onChange={() => clearFieldValidationIfValid(userGenderRef.current, userGenderErrorRef.current)}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div className="error-message" id="userGenderError" ref={userGenderErrorRef}></div>
            </div>

            <div className="form-group">
              <label htmlFor="userCountry" className="form-label">Country</label>
              <input type="text" id="userCountry" name="userCountry" className="form-input country-input" ref={userCountryRef}
                onInput={() => clearFieldValidationIfValid(userCountryRef.current, userCountryErrorRef.current)} />
              <div className="error-message" id="userCountryError" ref={userCountryErrorRef}></div>
            </div>

            <div className="form-group">
              <label htmlFor="userPassword" className="form-label">Password</label>
              <div className="password-input-container">
                <input type="password" id="userPassword" name="userPassword" className="form-input password-input" ref={userPasswordRef}
                  onInput={checkPasswordMatch} />
                <button type="button" className="password-toggle" id="togglePassword" ref={togglePasswordRef}
                  onClick={() => togglePasswordVisibility(userPasswordRef.current, togglePasswordRef.current)}
                  aria-label="Toggle password visibility">
                  <i className="fas fa-eye-slash"></i>
                </button>
              </div>
              <div className="error-message" id="userPasswordError" ref={userPasswordErrorRef}></div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="password-input-container">
                <input type="password" id="confirmPassword" name="confirmPassword" className="form-input password-input" ref={confirmPasswordRef}
                  onInput={checkPasswordMatch} />
                <button type="button" className="password-toggle" id="toggleConfirmPassword" ref={toggleConfirmPasswordRef}
                  onClick={() => togglePasswordVisibility(confirmPasswordRef.current, toggleConfirmPasswordRef.current)}
                  aria-label="Toggle confirm password visibility">
                  <i className="fas fa-eye-slash"></i>
                </button>
              </div>
              <div className="error-message" id="confirmPasswordError" ref={confirmPasswordErrorRef}></div>
            </div>

            <div className="password-match-message" id="passwordMatchMessage" ref={passwordMatchMessageRef}></div>

            <div className="terms-section">
              <p className="terms-intro">
                By creating an account, you agree to our <a href="#" className="terms-link" id="termsTrigger" onClick={(e) => { e.preventDefault(); openModal(); }}>Terms and Conditions</a>
              </p>

              <div className="terms-agreement">
                <input type="checkbox" id="termsAccept" name="termsAccept" className="terms-checkbox" ref={termsAcceptRef} />
                <label htmlFor="termsAccept" className="terms-label">I agree to the Terms and Conditions</label>
              </div>
              <div className="error-message" id="termsAcceptError" ref={termsAcceptErrorRef}></div>
            </div>

            <button type="submit" className="submit-button" disabled={submitting}>Create Account</button>
          </form>
        </section>
      </main>

      {/* Modal */}
      <div id="termsModal" className="modal-overlay" ref={modalRef} style={{ display: "none" }}>
        <div className="modal-container">
          <div className="modal-header">
            <h2 className="modal-title">Terms and Conditions</h2>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="terms-content">
              <section className="terms-section-modal">
                <h3 className="terms-heading">1. Account Registration</h3>
                <p className="terms-paragraph">You must provide accurate and complete information when creating your account.</p>
              </section>
              <section className="terms-section-modal">
                <h3 className="terms-heading">2. Data Privacy</h3>
                <p className="terms-paragraph">Your personal data is stored securely using Firebase and protected according to our privacy policy.</p>
              </section>
              <section className="terms-section-modal">
                <h3 className="terms-heading">3. User Responsibilities</h3>
                <p className="terms-paragraph">You are responsible for maintaining the confidentiality of your account credentials.</p>
              </section>
              <section className="terms-section-modal">
                <h3 className="terms-heading">4. Service Usage</h3>
                <p className="terms-paragraph">You agree to use this service only for lawful purposes and not to violate any applicable laws.</p>
              </section>
              <section className="terms-section-modal">
                <h3 className="terms-heading">5. Account Termination</h3>
                <p className="terms-paragraph">We reserve the right to suspend or terminate accounts that violate these terms.</p>
              </section>
            </div>
          </div>
          <div className="modal-footer">
            <button className="button-primary" id="acceptTerms" onClick={acceptTerms}>I Understand & Accept</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SignupPage;
