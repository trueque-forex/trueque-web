import BeneficiaryMethodHelper from './BeneficiaryMethodHelper';

const [formData, setFormData] = useState<{ beneficiaryMethod?: string; beneficiary?: any }>({});

<BeneficiaryMethodHelper
  onMethodChange={(value) =>
    setFormData((prev) => ({ ...prev, beneficiaryMethod: value }))
  }
  onCreated={(b) => setFormData((prev) => ({ ...prev, beneficiary: b }))}
/>