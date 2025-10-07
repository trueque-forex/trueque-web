import BeneficiaryMethodHelper from './BeneficiaryMethodHelper';

// Inside your form component
<BeneficiaryMethodHelper onMethodChange={(value) =>
  setFormData((prev) => ({ ...prev, beneficiaryMethod: value }))
} />