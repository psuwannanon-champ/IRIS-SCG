// Thai interface for the learner-facing surfaces. Strings not in the dictionary fall back to English,
// so governance and admin screens stay English in the prototype (stated in the language switch).
import { useSession } from '@/app/session'

export const TH: Record<string, string> = {
  // navigation
  'Home': 'หน้าแรก', 'My tasks': 'งานของฉัน', 'My journey': 'เส้นทางของฉัน', 'Assessment': 'แบบประเมิน', 'Learning plan': 'แผนการเรียน',
  'Lab days': 'วันเวิร์กช็อป', 'Impact contracts': 'สัญญาผลลัพธ์', 'Concepts & gates': 'แนวคิดและเกต', 'Skill passport': 'พาสปอร์ตทักษะ',
  'Success cases': 'กรณีความสำเร็จ', 'Talent marketplace': 'ตลาดงานภายใน', 'Impact ledger': 'บัญชีผลลัพธ์', 'Expert Guidance': 'ผู้ช่วยผู้เชี่ยวชาญ',
  'Updates': 'การแจ้งเตือน', 'My team': 'ทีมของฉัน', 'Work': 'งาน', 'Programs': 'โปรแกรม', 'Talent': 'บุคลากร', 'Governance': 'การกำกับดูแล', 'Support': 'ตัวช่วย',
  // common actions
  'Open': 'เปิด', 'View details': 'ดูรายละเอียด', 'Save': 'บันทึก', 'Cancel': 'ยกเลิก', 'Close': 'ปิด', 'Back': 'ย้อนกลับ', 'Next': 'ถัดไป', 'Previous': 'ก่อนหน้า',
  'Send': 'ส่ง', 'Start': 'เริ่ม', 'Skip': 'ข้าม', 'Restore': 'นำกลับ', 'Review': 'ทบทวน', 'Open module': 'เปิดโมดูล', 'Mark completed': 'ทำเครื่องหมายว่าเสร็จ',
  'Check in': 'เช็คอิน', 'Edit takeaway': 'แก้ไขสิ่งที่ได้เรียนรู้', 'Log evidence': 'บันทึกหลักฐาน', 'Start assessment': 'เริ่มทำแบบประเมิน',
  'Get Expert Guidance': 'ขอคำแนะนำจากผู้เชี่ยวชาญ', 'Refresh guidance': 'อัปเดตคำแนะนำ',
  // learner page headers
  'Good day': 'สวัสดี',
  'Applied capability labs': 'เวิร์กช็อปภาคปฏิบัติ',
  'AI skill diagnostic': 'การวินิจฉัยทักษะด้วย AI',
  'Where you are in each program, your AI skill diagnostic and the gaps prioritised for you.': 'คุณอยู่ตรงไหนในแต่ละโปรแกรม ผลวินิจฉัยทักษะ และช่องว่างที่จัดลำดับความสำคัญไว้สำหรับคุณ',
  'Your personal micro-learning path, selected by Expert Guidance from your diagnostic: which modules, in what order, and what to skip. Open a module to study it and mark it complete; finish the pre-work before each lab day.': 'เส้นทางการเรียนรู้ส่วนบุคคลที่เลือกให้จากผลวินิจฉัยของคุณ ว่าจะเรียนโมดูลใด ลำดับใด และข้ามอะไรได้ เปิดโมดูลเพื่อเรียนและทำเครื่องหมายว่าเสร็จ และเรียนงานก่อนเข้าเวิร์กช็อปให้ครบ',
  // statuses learners see
  'Draft': 'ฉบับร่าง', 'Waiting for manager': 'รอผู้จัดการสายงาน', 'Waiting for sponsor': 'รอผู้สนับสนุน', 'Sprint active': 'สปรินต์กำลังดำเนินการ',
  'Mid-sprint gate': 'เกตกลางสปรินต์', 'Showcase review': 'รอตรวจผลงาน', 'Impact validated': 'ผลลัพธ์ได้รับการรับรอง', 'Returned for changes': 'ส่งกลับให้แก้ไข',
  'Invited': 'ได้รับเชิญ', 'Diagnosed': 'วินิจฉัยแล้ว', 'In labs': 'อยู่ในเวิร์กช็อป', 'In sprint': 'อยู่ในสปรินต์', 'Showcase': 'นำเสนอผลงาน', 'Graduated': 'จบโปรแกรม',
  'planned': 'วางแผนไว้', 'in progress': 'กำลังเรียน', 'completed': 'เรียนจบแล้ว', 'skipped': 'ข้ามไว้',
  // explanations learners read often
  'Actionable tasks': 'งานที่ต้องทำ', 'Unread updates': 'การแจ้งเตือนที่ยังไม่ได้อ่าน', 'Outcome-verified badges': 'ตราทักษะที่รับรองจากผลงานจริง',
  'Your tasks': 'งานของคุณ', 'Recent updates': 'อัปเดตล่าสุด', 'Your programs': 'โปรแกรมของคุณ',
  'No actions waiting': 'ไม่มีงานที่ต้องทำในตอนนี้', 'You are up to date': 'คุณอ่านครบแล้ว',
}

export function useT() {
  const lang = useSession((s) => s.lang)
  return (en: string) => (lang === 'th' ? TH[en] ?? en : en)
}
export function useLang() {
  const lang = useSession((s) => s.lang)
  const setLang = useSession((s) => s.setLang)
  return { lang, setLang }
}
