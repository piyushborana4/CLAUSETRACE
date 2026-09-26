/**
 * Domain-Specific Legal Clause Benchmarks & Fair Market Standards
 * Authoritative comparative standards across multiple agreement types, complete with
 * statutory legal references and risk criteria.
 */

export interface ClauseBenchmark {
  id: string;
  category: string;
  topic: string;
  marketStandard: string;
  favorableToUser: string;
  highRiskIndicator: string;
  applicableLawGuidance: string;
  statutoryReference?: string;
  confidenceScore?: number;
}

export interface ContractDomainBenchmark {
  domainId: string;
  domainName: string;
  description: string;
  targetAudience: string;
  benchmarks: ClauseBenchmark[];
}

export const LEGAL_DOMAIN_BENCHMARKS: ContractDomainBenchmark[] = [
  {
    domainId: 'employment',
    domainName: 'Employment & Offer Agreements',
    description: 'Standard terms for professional hires, engineering staff, and executives.',
    targetAudience: 'Employees, Candidates & HR Professionals',
    benchmarks: [
      {
        id: 'emp-notice',
        category: 'TERMINATION',
        topic: 'Notice Period Duration',
        marketStandard: '30 to 60 days post-confirmation, with mutual right to buyout at base salary.',
        favorableToUser: '30 days, or payment in lieu of notice accepted automatically upon employee request.',
        highRiskIndicator: '90+ days with employer-only discretion to refuse buyout, or liquidated damages beyond salary.',
        applicableLawGuidance: 'Industrial disputes & state shops and establishments acts frequently stipulate 30 days standard notice.',
        statutoryReference: 'Shops & Commercial Establishments Act § 30',
        confidenceScore: 0.98,
      },
      {
        id: 'emp-bond',
        category: 'FINANCIAL_OBLIGATION',
        topic: 'Training Costs & Retention Bonds',
        marketStandard: 'Straight-line pro-rata amortization over 12 months tied to verifiable external invoice receipts.',
        favorableToUser: 'No lock-in bond, or nominal expense reimbursement only if leaving within first 6 months.',
        highRiskIndicator: 'Flat unamortized liquidated damages (e.g. 2+ years salary/fixed penalty) without proof of expense.',
        applicableLawGuidance: 'Courts hold that unreasonable penalty bonds violating freedom of trade are void under Section 27 of Contract Acts.',
        statutoryReference: 'Indian Contract Act 1872 § 27 & § 74 / Common Law Restraint Doctrine',
        confidenceScore: 0.97,
      },
      {
        id: 'emp-noncompete',
        category: 'RESTRICTION',
        topic: 'Post-Employment Non-Compete',
        marketStandard: 'Limited non-solicitation of clients/coworkers for 6-12 months. Post-employment non-competes are unenforceable in most common law jurisdictions.',
        favorableToUser: 'Confidentiality protection only, without restraint on future lawful employment.',
        highRiskIndicator: 'Broad blanket prohibition on joining any competitor worldwide for 1-2 years without compensation.',
        applicableLawGuidance: 'Restraints on lawful profession or trade after employment ceases are invalid under standard common law & statutory doctrine.',
        statutoryReference: 'Doctrine of Restraint of Trade / Section 27 Contract Act / FTC Non-Compete Rules',
        confidenceScore: 0.99,
      },
      {
        id: 'emp-ip',
        category: 'INTELLECTUAL_PROPERTY',
        topic: 'Invention & Work Product Assignment',
        marketStandard: 'Assignment of works created during working hours using employer equipment in the company line of business.',
        favorableToUser: 'Explicit carve-out for prior inventions and personal open-source projects created outside working hours.',
        highRiskIndicator: 'Perpetual assignment of all inventions developed anywhere, anytime during the term of employment.',
        applicableLawGuidance: 'Moonlighting and pre-existing IP should be expressly listed in an Exhibit A disclosure form.',
        statutoryReference: 'Copyright Act § 17 / Patent Act Work-for-Hire Provisions',
        confidenceScore: 0.96,
      },
      {
        id: 'emp-probation',
        category: 'COMPLIANCE',
        topic: 'Probation Period & Extension',
        marketStandard: '3 to 6 months with 15-day notice during probation. Written confirmation required.',
        favorableToUser: '3 months fixed probation with deemed confirmation if no written extension provided within 14 days.',
        highRiskIndicator: 'Uncapped probation extension (e.g. up to 12 months) at sole employer discretion without salary increment.',
        applicableLawGuidance: 'Probation terms must specify measurable evaluation milestones.',
        statutoryReference: 'Model Standing Orders / Employment Standards',
        confidenceScore: 0.95,
      },
    ],
  },
  {
    domainId: 'residential_rental',
    domainName: 'Residential Lease & Tenancy',
    description: 'Standards for residential rent agreements, security deposits, and notice.',
    targetAudience: 'Tenants, Homeowners & Property Managers',
    benchmarks: [
      {
        id: 'rent-deposit',
        category: 'FINANCIAL_OBLIGATION',
        topic: 'Security Deposit & Refund Timeline',
        marketStandard: '2 to 3 months rent (or local statutory cap), refundable within 7 to 14 days of handover.',
        favorableToUser: '1 to 2 months rent, returned on the date of key handover after joint inspection.',
        highRiskIndicator: '6+ months deposit with vague refund timelines (>60 days) or discretionary deductions.',
        applicableLawGuidance: 'Tenancy acts mandate itemized deduction receipts and strict return deadlines.',
        statutoryReference: 'Model Tenancy Act 2021 § 11 (Cap at 2 months for residential)',
        confidenceScore: 0.99,
      },
      {
        id: 'rent-lockin',
        category: 'TERMINATION',
        topic: 'Lock-in Period & Early Exit',
        marketStandard: '6-month lock-in or 1-month rent penalty for departure during first year.',
        favorableToUser: 'No lock-in, 30 days simple written notice at any time.',
        highRiskIndicator: 'Mandatory 11-month or 3-year lock-in with full forfeiture of remaining lease rent regardless of re-letting.',
        applicableLawGuidance: 'Liquidated damages must represent actual landlord re-letting mitigation loss, not penalty.',
        statutoryReference: 'Contract Act § 74 / Duty to Mitigate Losses',
        confidenceScore: 0.95,
      },
      {
        id: 'rent-repairs',
        category: 'COMPLIANCE',
        topic: 'Maintenance & Structural Repairs',
        marketStandard: 'Major structural, plumbing, and electrical repairs paid by landlord; minor wear and tear by tenant.',
        favorableToUser: 'Tenant liability capped at fixed threshold (e.g., first $25/₹1,500 per minor incident).',
        highRiskIndicator: 'Tenant made solely responsible for all maintenance, structural leaks, seepage, and external painting.',
        applicableLawGuidance: 'Landlord is statutorily obligated to maintain premises in habitable condition.',
        statutoryReference: 'Transfer of Property Act § 108 / Habitability Doctrine',
        confidenceScore: 0.97,
      },
      {
        id: 'rent-painting',
        category: 'FINANCIAL_OBLIGATION',
        topic: 'Move-Out Painting Deductions',
        marketStandard: 'Deductions only for damage beyond normal wear-and-tear, supported by contractor invoices.',
        favorableToUser: 'No mandatory painting deduction unless tenure is under 11 months, with right to arrange own painting.',
        highRiskIndicator: 'Automatic 1-month rent deduction for repainting regardless of duration or condition.',
        applicableLawGuidance: 'Automatic standard deductions without proof of damage violate security deposit principles.',
        statutoryReference: 'Consumer Protection Regulations / Tenancy Rules',
        confidenceScore: 0.96,
      },
    ],
  },
  {
    domainId: 'commercial_lease',
    domainName: 'Commercial Office & Retail Lease',
    description: 'Provisions for commercial space, fit-out periods, CAM charges, and force majeure.',
    targetAudience: 'Founders, CFOs, Real Estate Legal Teams',
    benchmarks: [
      {
        id: 'com-forcemajeure',
        category: 'RENEWAL_CANCELLATION',
        topic: 'Force Majeure & Rent Abatement',
        marketStandard: 'Pro-rata rent suspension if premises are inaccessible due to fire, government order, or pandemic.',
        favorableToUser: 'Immediate rent waiver and right to terminate after 60 days of continuous inaccessibility.',
        highRiskIndicator: 'No rent abatement clause; full rent remains unconditionally payable.',
        applicableLawGuidance: 'Frustration of contract under Section 56 requires clear allocation of force majeure risk.',
        statutoryReference: 'Indian Contract Act 1872 § 56 / UCC § 2-615',
        confidenceScore: 0.97,
      },
      {
        id: 'com-cam',
        category: 'FINANCIAL_OBLIGATION',
        topic: 'Common Area Maintenance (CAM) Audit',
        marketStandard: 'Actual incurred cost pass-through with annual audit rights and 5% cap on management fees.',
        favorableToUser: 'Fixed all-inclusive CAM or audited actuals with 30-day objection window.',
        highRiskIndicator: 'Uncapped CAM charges at landlord sole discretion without audit verification.',
        applicableLawGuidance: 'Pass-through expenses must be verifiable against audited building utility statements.',
        statutoryReference: 'Commercial Real Estate Standard Practices',
        confidenceScore: 0.94,
      },
      {
        id: 'com-signage',
        category: 'GENERAL',
        topic: 'Signage & Facade Rights',
        marketStandard: 'Right to internal directory and door signage; external facade subject to building guidelines.',
        favorableToUser: 'Free primary facade signage and elevator lobby branding.',
        highRiskIndicator: 'Prohibition on all tenant signage or exorbitant recurring monthly signage licensing fees.',
        applicableLawGuidance: 'Commercial leases customarily grant proportional branding rights.',
        confidenceScore: 0.92,
      },
    ],
  },
  {
    domainId: 'vendor_msa',
    domainName: 'Vendor Master Services Agreement (MSA) & SaaS',
    description: 'Terms for enterprise software, consulting services, SLAs, and liability caps.',
    targetAudience: 'Procurement Teams, SaaS Buyers & Enterprise Vendors',
    benchmarks: [
      {
        id: 'msa-liability',
        category: 'DISPUTE_RESOLUTION',
        topic: 'Limitation of Liability Cap',
        marketStandard: 'Mutual cap equal to 12 months fees paid or payable under the applicable SOW.',
        favorableToUser: 'Super-cap (2x-3x) or carve-out for data breaches, IP infringement, and confidentiality breaches.',
        highRiskIndicator: 'Unilateral liability cap favoring vendor only, with customer liability completely uncapped.',
        applicableLawGuidance: 'Unconscionable or one-sided liability limitations may be struck down in commercial disputes.',
        statutoryReference: 'Uniform Commercial Code / Contract Act § 73',
        confidenceScore: 0.98,
      },
      {
        id: 'msa-sla',
        category: 'COMPLIANCE',
        topic: 'Service Level Agreement (SLA) & Service Credits',
        marketStandard: '99.9% uptime with tiered service credits (10% to 50% monthly fee) for outages.',
        favorableToUser: '99.95% uptime, termination right if uptime falls below 99% in two consecutive months.',
        highRiskIndicator: 'No SLA guarantees or "best efforts" commitment with zero financial remedy for downtime.',
        applicableLawGuidance: 'Service credits should be designated as sole remedy for standard performance failures.',
        confidenceScore: 0.96,
      },
      {
        id: 'msa-data-privacy',
        category: 'COMPLIANCE',
        topic: 'Data Privacy & Security Safeguards',
        marketStandard: 'SOC 2 Type II compliance, encryption in transit and at rest, 72-hour breach notification.',
        favorableToUser: '24-hour breach notification, right to independent security audit, data localization commitment.',
        highRiskIndicator: 'No warranty of data security, vendor disclaims responsibility for sub-processor breaches.',
        applicableLawGuidance: 'Mandatory compliance with GDPR, DPDP Act 2023, and state privacy mandates.',
        statutoryReference: 'Digital Personal Data Protection Act 2023 § 8 / GDPR Art. 28',
        confidenceScore: 0.99,
      },
    ],
  },
  {
    domainId: 'nda_confidentiality',
    domainName: 'Non-Disclosure Agreement (NDA)',
    description: 'Mutual and unilateral confidentiality agreements for business discussions.',
    targetAudience: 'Startups, Corporate Developers, Investors & Contractors',
    benchmarks: [
      {
        id: 'nda-mutuality',
        category: 'CONFIDENTIALITY',
        topic: 'Mutuality of Obligations',
        marketStandard: 'Mutual bilateral obligations protecting both disclosing and receiving parties equally.',
        favorableToUser: 'Standard mutual terms with identical definitions and remedies for both sides.',
        highRiskIndicator: 'Unilateral NDA where only one party is bound by confidentiality and non-use restrictions.',
        applicableLawGuidance: 'Bilateral negotiations standardly warrant mutual confidentiality protections.',
        confidenceScore: 0.99,
      },
      {
        id: 'nda-term',
        category: 'CONFIDENTIALITY',
        topic: 'Duration of Confidentiality Obligation',
        marketStandard: '2 to 3 years from disclosure date. Trade secrets protected perpetually.',
        favorableToUser: '2 years maximum for general commercial information; clear sunset on discussions.',
        highRiskIndicator: 'Perpetual confidentiality on all shared information, including general business discussions.',
        applicableLawGuidance: 'Unreasonable indefinite restraints on non-trade secret information are disfavored.',
        statutoryReference: 'Defend Trade Secrets Act (DTSA) / Trade Secret Common Law',
        confidenceScore: 0.97,
      },
      {
        id: 'nda-carveouts',
        category: 'CONFIDENTIALITY',
        topic: 'Standard Exclusions from Confidential Info',
        marketStandard: 'Exclusion of information publicly known, already known, independently developed, or lawfully received from 3rd party.',
        favorableToUser: 'Standard 4 standard carve-outs plus residual knowledge exception for general skills.',
        highRiskIndicator: 'Omission of standard public domain or independent development carve-outs.',
        applicableLawGuidance: 'Standard carve-outs are essential to avoid overbroad injunctions.',
        confidenceScore: 0.98,
      },
    ],
  },
];
