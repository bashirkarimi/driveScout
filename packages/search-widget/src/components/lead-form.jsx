import { useState, useRef, useEffect, memo } from "react";
import { FormInput } from "./form-input";
import { Button } from "./button";

export const LeadForm = memo(({ vehicleData, onClose, onSubmit }) => {
  const { id: vehicleId, title, subtitle, pricing } = vehicleData;
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [vehicleData.title]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the parent onSubmit handler with form data and car info
      await onSubmit({
        ...formData,
        vehicleTitle: title,
        vehicleId: vehicleId || title,
        requestType: "test_drive",
        timestamp: new Date().toISOString(),
      });

      setSubmitSuccess(true);

      // Close form after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to submit lead form:", error);
      setErrors({ submit: "Failed to submit. Please try again." });
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center bg-white p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-slate-900">
          Request Sent!
        </h3>
        <p className="text-slate-600">
          Thank you for your interest in the {title}. A dealer representative
          will contact you shortly.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={formRef}
      className="flex h-full flex-col overflow-y-auto bg-white"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
        <h3 className="text-xl font-bold text-slate-900">Book Test Drive</h3>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close form"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-semibold text-slate-900">{title}</h4>
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          {pricing?.priceFormatted && (
            <p className="mt-1 text-lg font-bold text-elm-600">
              {pricing.priceFormatted}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
              placeholder="John"
            />
            <FormInput
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
              placeholder="Doe"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="john.doe@example.com"
            />

            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <FormInput
            label="Message (Optional)"
            name="message"
            type="textarea"
            value={formData.message}
            onChange={handleChange}
            placeholder="Any specific questions or preferred contact times?"
            rows={4}
          />

          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row ml-auto">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});
