/**
 * 개인정보 처리방침 / 이용약관 표준 양식 (국문·영문).
 * 사내 마스터 데이터 관리 시스템(T:MDM) 기준의 일반 템플릿이며,
 * 실제 적용 시 법무·정보보호 부서 검토 후 문구를 확정한다.
 */

export type LegalKind = 'privacy' | 'terms';
export type LegalLang = 'ko' | 'en';

export interface LegalSection {
  heading: string;
  /** 단락(문자열) 또는 불릿 목록(문자열 배열)의 혼합. */
  body: (string | string[])[];
}

export interface LegalDocument {
  title: string;
  /** "최종 개정일" 라벨 + 일자. */
  effectiveLabel: string;
  effectiveDate: string;
  sections: LegalSection[];
}

const COMPANY_KO = '한국타이어앤테크놀로지㈜';
const COMPANY_EN = 'Hankook Tire & Technology Co., Ltd.';
const SERVICE_KO = 'T:MDM(시험 기준정보 관리 시스템)';
const SERVICE_EN = 'T:MDM (Test Master Data Management System)';
const EFFECTIVE = '2026-06-18';

const DOCUMENTS: Record<LegalLang, Record<LegalKind, LegalDocument>> = {
  ko: {
    privacy: {
      title: '개인정보 처리방침',
      effectiveLabel: '최종 개정일',
      effectiveDate: EFFECTIVE,
      sections: [
        {
          heading: '제1조 (총칙)',
          body: [
            `${COMPANY_KO}(이하 "회사")는 임직원 및 협력사 사용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관계 법령을 준수합니다. 본 방침은 ${SERVICE_KO}(이하 "서비스") 이용 과정에서 처리되는 개인정보의 항목과 처리 목적, 보유 기간, 이용자의 권리를 규정합니다.`,
          ],
        },
        {
          heading: '제2조 (수집하는 개인정보 항목)',
          body: [
            '회사는 서비스 제공을 위하여 아래의 최소한의 정보를 수집·처리합니다.',
            [
              '필수: 사번(사용자 ID), 성명, 소속 부서/팀, 직무 권한(Role)',
              '인증: 로그인 토큰, 비밀번호(단방향 암호화 저장)',
              '자동 생성: 접속 일시, 접근 IP, 사용 이력(감사 로그)',
            ],
          ],
        },
        {
          heading: '제3조 (개인정보의 처리 목적)',
          body: [
            [
              '사용자 식별 및 인증, 접근 권한(Role) 기반 기능 제어',
              '시험 기준정보의 생성·조회·변경에 대한 이력 관리 및 감사',
              '서비스 운영, 오류 분석, 보안 사고 대응',
            ],
          ],
        },
        {
          heading: '제4조 (보유 및 이용 기간)',
          body: [
            '회사는 원칙적으로 개인정보 처리 목적이 달성되면 지체 없이 파기합니다. 다만, 다음의 경우 명시한 기간 동안 보관합니다.',
            [
              '접속 및 감사 로그: 관계 법령 및 내부 정보보호 정책에 따라 최대 1년',
              '퇴직·계정 해지 시: 관련 절차 종료 후 즉시 파기',
            ],
          ],
        },
        {
          heading: '제5조 (개인정보의 제3자 제공 및 처리 위탁)',
          body: [
            '회사는 이용자의 개인정보를 본 방침에 명시한 범위를 초과하여 외부에 제공하지 않습니다. 다만, 관계 법령에 따라 적법한 요청이 있는 경우 또는 시스템 운영을 위한 위탁이 필요한 경우에 한하여, 관련 법령에 따라 안전하게 처리합니다.',
          ],
        },
        {
          heading: '제6조 (이용자의 권리와 행사 방법)',
          body: [
            '이용자는 언제든지 본인의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있으며, 회사는 관계 법령에 따라 지체 없이 조치합니다. 권리 행사는 정보보호 담당 부서를 통하여 요청할 수 있습니다.',
          ],
        },
        {
          heading: '제7조 (개인정보의 안전성 확보 조치)',
          body: [
            [
              '비밀번호 단방향 암호화 저장 및 전송 구간 암호화',
              '접근 권한 최소화 및 권한별 기능 분리(Role 기반 접근 통제)',
              '접근 기록 보관 및 위·변조 방지를 위한 감사 로그 운영',
            ],
          ],
        },
        {
          heading: '제8조 (개인정보 보호책임자)',
          body: [
            '회사는 개인정보 처리에 관한 업무를 총괄하는 개인정보 보호책임자를 지정하고 있습니다. 개인정보 관련 문의는 사내 정보보호 담당 부서 또는 헬프데스크로 접수하실 수 있습니다.',
          ],
        },
        {
          heading: '제9조 (방침의 변경)',
          body: [
            '본 개인정보 처리방침은 법령·정책의 변경에 따라 개정될 수 있으며, 변경 시 시행일과 변경 내용을 서비스 내 공지합니다.',
          ],
        },
      ],
    },
    terms: {
      title: '이용약관',
      effectiveLabel: '시행일',
      effectiveDate: EFFECTIVE,
      sections: [
        {
          heading: '제1조 (목적)',
          body: [
            `본 약관은 ${COMPANY_KO}(이하 "회사")가 제공하는 ${SERVICE_KO}(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`,
          ],
        },
        {
          heading: '제2조 (정의)',
          body: [
            [
              '"이용자"란 본 약관에 따라 회사가 부여한 계정으로 서비스를 이용하는 임직원 및 승인된 협력사 사용자를 말합니다.',
              '"계정"이란 이용자 식별 및 서비스 이용을 위해 부여되는 사번 기반 ID와 비밀번호를 말합니다.',
              '"기준정보"란 서비스를 통해 관리되는 시험 항목·분류·재료 스펙 등 마스터 데이터를 말합니다.',
            ],
          ],
        },
        {
          heading: '제3조 (서비스의 제공)',
          body: [
            '회사는 시험 기준정보의 조회·등록·변경·감사 등 마스터 데이터 관리 기능을 제공합니다. 서비스의 구체적 기능과 접근 범위는 이용자에게 부여된 권한(Role)에 따라 달라질 수 있습니다.',
          ],
        },
        {
          heading: '제4조 (계정 및 보안)',
          body: [
            [
              '이용자는 부여받은 계정을 제3자에게 양도·대여할 수 없으며, 계정 관리 책임은 이용자 본인에게 있습니다.',
              '이용자는 비밀번호를 안전하게 관리하여야 하며, 계정의 무단 사용을 인지한 경우 즉시 회사에 통지하여야 합니다.',
            ],
          ],
        },
        {
          heading: '제5조 (이용자의 의무)',
          body: [
            '이용자는 다음 행위를 하여서는 안 됩니다.',
            [
              '권한 범위를 초과하여 기준정보에 접근하거나 이를 변경·삭제하는 행위',
              '서비스를 통해 취득한 정보를 업무 목적 외로 사용하거나 외부에 유출하는 행위',
              '시스템의 정상적인 운영을 방해하거나 보안을 침해하는 일체의 행위',
            ],
          ],
        },
        {
          heading: '제6조 (데이터의 권리)',
          body: [
            '서비스를 통해 처리되는 모든 기준정보 및 산출물에 대한 권리는 회사에 귀속됩니다. 이용자는 부여된 권한 범위 내에서 업무 목적으로만 데이터를 이용할 수 있습니다.',
          ],
        },
        {
          heading: '제7조 (서비스의 중단)',
          body: [
            '회사는 시스템 점검, 장애, 불가항력 등의 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있으며, 가능한 범위에서 사전 또는 사후에 이를 공지합니다.',
          ],
        },
        {
          heading: '제8조 (책임의 제한)',
          body: [
            '회사는 천재지변, 불가항력, 이용자의 귀책으로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다. 이용자가 본 약관 및 관련 정책을 위반하여 발생한 손해에 대한 책임은 이용자에게 있습니다.',
          ],
        },
        {
          heading: '제9조 (약관의 개정)',
          body: [
            '회사는 관련 법령 및 운영 정책에 따라 본 약관을 개정할 수 있으며, 개정 시 시행일과 변경 내용을 서비스 내 공지합니다. 이용자가 개정 약관 시행일 이후 서비스를 계속 이용하는 경우 개정 약관에 동의한 것으로 봅니다.',
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy Policy',
      effectiveLabel: 'Last updated',
      effectiveDate: EFFECTIVE,
      sections: [
        {
          heading: '1. General',
          body: [
            `${COMPANY_EN} (the "Company") values the personal data of its employees and partner users and complies with the Personal Information Protection Act and other applicable laws. This policy describes the personal data processed in connection with the use of ${SERVICE_EN} (the "Service"), the purposes of processing, retention periods, and users' rights.`,
          ],
        },
        {
          heading: '2. Personal Data We Collect',
          body: [
            'The Company collects and processes the following minimum information to provide the Service.',
            [
              'Required: employee number (user ID), name, department/team, role',
              'Authentication: login token, password (stored as a one-way hash)',
              'Automatically generated: access timestamps, IP address, usage history (audit logs)',
            ],
          ],
        },
        {
          heading: '3. Purpose of Processing',
          body: [
            [
              'User identification and authentication, role-based feature control',
              'Change history and auditing for creation, retrieval, and modification of test master data',
              'Service operation, error analysis, and security incident response',
            ],
          ],
        },
        {
          heading: '4. Retention and Use Period',
          body: [
            'In principle, the Company destroys personal data without delay once the purpose of processing is achieved, except where retention is required as follows.',
            [
              'Access and audit logs: up to 1 year in accordance with applicable laws and internal security policy',
              'Upon resignation or account termination: destroyed immediately after the relevant procedures are completed',
            ],
          ],
        },
        {
          heading: '5. Provision to Third Parties and Outsourcing',
          body: [
            'The Company does not provide users\' personal data externally beyond the scope set out in this policy. Where a lawful request is made under applicable law, or outsourcing is required for system operation, the data is handled securely in accordance with the relevant laws.',
          ],
        },
        {
          heading: "6. Users' Rights",
          body: [
            'Users may at any time request access to, correction of, deletion of, or suspension of processing of their personal data, and the Company will act without delay in accordance with applicable laws. Such requests may be submitted through the data protection department.',
          ],
        },
        {
          heading: '7. Security Measures',
          body: [
            [
              'One-way encryption of passwords and encryption of data in transit',
              'Least-privilege access and role-based access control',
              'Retention of access records and audit logs to prevent tampering',
            ],
          ],
        },
        {
          heading: '8. Data Protection Officer',
          body: [
            'The Company designates a Data Protection Officer responsible for overseeing personal data processing. Inquiries may be submitted to the internal data protection department or the helpdesk.',
          ],
        },
        {
          heading: '9. Changes to this Policy',
          body: [
            'This Privacy Policy may be revised in response to changes in laws or policies. Any changes will be announced within the Service together with the effective date.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      effectiveLabel: 'Effective date',
      effectiveDate: EFFECTIVE,
      sections: [
        {
          heading: '1. Purpose',
          body: [
            `These Terms govern the rights, obligations, and responsibilities between ${COMPANY_EN} (the "Company") and users in connection with the use of ${SERVICE_EN} (the "Service").`,
          ],
        },
        {
          heading: '2. Definitions',
          body: [
            [
              '"User" means an employee or approved partner user who uses the Service with an account granted by the Company under these Terms.',
              '"Account" means the employee-number-based ID and password granted for user identification and Service use.',
              '"Master data" means the test items, classifications, material specifications, and other master data managed through the Service.',
            ],
          ],
        },
        {
          heading: '3. Provision of the Service',
          body: [
            'The Company provides master data management functions such as retrieval, registration, modification, and auditing of test master data. The specific features and access scope available may vary according to the role granted to the user.',
          ],
        },
        {
          heading: '4. Account and Security',
          body: [
            [
              'Users may not transfer or lend their granted account to any third party, and are responsible for managing their account.',
              'Users must keep their passwords secure and must notify the Company immediately upon becoming aware of any unauthorized use of their account.',
            ],
          ],
        },
        {
          heading: "5. Users' Obligations",
          body: [
            'Users must not engage in any of the following.',
            [
              'Accessing, modifying, or deleting master data beyond their granted authority',
              'Using information obtained through the Service for non-business purposes or disclosing it externally',
              'Any act that interferes with the normal operation of the system or compromises its security',
            ],
          ],
        },
        {
          heading: '6. Rights to Data',
          body: [
            'All rights to the master data and outputs processed through the Service belong to the Company. Users may use the data only for business purposes within their granted authority.',
          ],
        },
        {
          heading: '7. Suspension of the Service',
          body: [
            'The Company may temporarily suspend the Service in the event of system maintenance, failure, force majeure, or similar causes, and will announce such suspension in advance or afterward where possible.',
          ],
        },
        {
          heading: '8. Limitation of Liability',
          body: [
            'The Company is not liable for any disruption to the Service caused by acts of God, force majeure, or causes attributable to the user. Users are responsible for any damages arising from their violation of these Terms or related policies.',
          ],
        },
        {
          heading: '9. Amendment of Terms',
          body: [
            'The Company may amend these Terms in accordance with applicable laws and operating policies. Any amendment will be announced within the Service together with its effective date. If a user continues to use the Service after the effective date of the amended Terms, the user is deemed to have agreed to them.',
          ],
        },
      ],
    },
  },
};

/**
 * 현재 언어에 맞는 법적 문서를 반환. 미지원 언어는 영문으로 폴백.
 * 이 앱의 한국어 로케일 코드는 'kr'(표준 'ko' 아님)이므로 둘 다 한국어로 처리.
 */
export function getLegalDocument(kind: LegalKind, lang: string): LegalDocument {
  const lower = lang.toLowerCase();
  const resolved: LegalLang = lower.startsWith('kr') || lower.startsWith('ko') ? 'ko' : 'en';
  return DOCUMENTS[resolved][kind];
}
