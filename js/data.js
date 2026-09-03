/* =========================================================
 * CRM 数据层：localStorage 持久化 + 演示种子数据
 * ========================================================= */
const STORE_KEY = 'crm_db_v1';
const UID_KEY = 'crm_current_uid';

/* 日期工具：生成相对今天的日期字符串，保证演示时“逾期/到期”始终有效 */
function dayStr(offset) {
  const t = new Date();
  t.setDate(t.getDate() + offset);
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${t.getFullYear()}-${m}-${d}`;
}
function dateTimeStr(offset, hour) {
  return `${dayStr(offset)}T${String(hour).padStart(2, '0')}:00`;
}
function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

/* 渠道与字典 */
const SOURCES = ['官方网站', '行业展会', '线上广告', '客户转介绍', '电话营销', '社交媒体', '渠道合作'];
const LEAD_STATUS = { unassigned: '未分配', assigned: '已分配', converted: '已转化', discarded: '已废弃' };
const LEVELS = { A: 'A类(重点)', B: 'B类(普通)', C: 'C类(观察)' };
const LOG_TYPES = { call: '电话', email: '邮件', wechat: '微信', visit: '上门拜访', quote: '报价', note: '备注' };
const OPP_STAGES = [
  { key: 'initial', name: '初步接触', color: '#6b7280' },
  { key: 'quote', name: '报价', color: '#0891b2' },
  { key: 'negotiation', name: '谈判', color: '#d97706' },
  { key: 'won', name: '已成交', color: '#16a34a' },
  { key: 'lost', name: '已失败', color: '#dc2626' }
];
const TASK_CATEGORIES = ['拓客', '跟进', '拜访', '会议', '其他'];

/* ---------------- 种子数据 ---------------- */
function buildSeed() {
  const users = [
    { id: 'u1', name: '赵磊', role: 'admin', title: '销售经理' },
    { id: 'u2', name: '钱蕾', role: 'sales', title: '销售代表' },
    { id: 'u3', name: '孙浩', role: 'sales', title: '销售代表' },
    { id: 'u4', name: '李娟', role: 'sales', title: '销售代表' },
    { id: 'u5', name: '周斌', role: 'sales', title: '销售代表' }
  ];

  const leads = [
    { id: 'l1', company: '深圳市华科电子有限公司', contact: '王建国', position: '采购总监', phone: '138-0288-1101', email: 'wangjg@huake.com', source: '行业展会', tags: ['高意向', '大客户'], status: 'converted', ownerId: 'u2', remark: '广交会展位收集，对智能穿戴方案兴趣浓厚', createdAt: dayStr(-45), deletedAt: null },
    { id: 'l2', company: '上海云途科技有限公司', contact: '李晓梅', position: 'IT经理', phone: '139-1122-3344', email: 'lixm@yuntu.cn', source: '官方网站', tags: ['预算充足'], status: 'converted', ownerId: 'u2', remark: '官网表单咨询企业SaaS年费方案', createdAt: dayStr(-38), deletedAt: null },
    { id: 'l3', company: '北京智造机械股份公司', contact: '陈志远', position: '设备科长', phone: '137-5566-7788', email: 'chenzy@zhizao.com', source: '线上广告', tags: ['高意向'], status: 'converted', ownerId: 'u3', remark: '百度信息流广告留资，需自动化产线配件', createdAt: dayStr(-30), deletedAt: null },
    { id: 'l4', company: '广州美裳服饰贸易', contact: '赵敏', position: '创始人', phone: '136-9988-0011', email: 'zhaomin@meishang.com', source: '社交媒体', tags: ['价格敏感'], status: 'assigned', ownerId: 'u4', remark: '抖音主页私信咨询ERP系统', createdAt: dayStr(-20), deletedAt: null },
    { id: 'l5', company: '杭州鲜丰食品有限公司', contact: '黄磊', position: '运营主管', phone: '135-2233-4455', email: 'huanglei@xianfeng.com', source: '客户转介绍', tags: ['高意向', '转介绍'], status: 'assigned', ownerId: 'u2', remark: '华科电子王总转介绍，冷链配送项目', createdAt: dayStr(-15), deletedAt: null },
    { id: 'l6', company: '成都天府建材集团', contact: '周婷', position: '采购经理', phone: '134-6677-8899', email: 'zhouting@tianfu.com', source: '行业展会', tags: ['大客户'], status: 'assigned', ownerId: 'u5', remark: '建材博览会收集，年度集采需求', createdAt: dayStr(-12), deletedAt: null },
    { id: 'l7', company: '苏州精工模具厂', contact: '吴刚', position: '厂长', phone: '133-1100-2233', email: 'wugang@jinggong.com', source: '渠道合作', tags: [], status: 'assigned', ownerId: 'u3', remark: '代理商推荐客户', createdAt: dayStr(-9), deletedAt: null },
    { id: 'l8', company: '武汉光通信技术公司', contact: '郑洁', position: '研发总监', phone: '132-4455-6677', email: 'zhengjie@gtx-tech.com', source: '官方网站', tags: ['技术型'], status: 'assigned', ownerId: 'u4', remark: '官网下载白皮书后留资', createdAt: dayStr(-7), deletedAt: null },
    { id: 'l9', company: '青岛海润物流有限公司', contact: '孙鹏', position: '调度中心主任', phone: '131-8899-0011', email: 'sunpeng@hairun.com', source: '电话营销', tags: [], status: 'assigned', ownerId: 'u5', remark: '外呼拓客，有意向升级车队管理系统', createdAt: dayStr(-5), deletedAt: null },
    { id: 'l10', company: '东莞恒达五金塑胶', contact: '马涛', position: '采购', phone: '130-2211-3344', email: 'matao@hengda.com', source: '线上广告', tags: ['价格敏感'], status: 'unassigned', ownerId: null, remark: '360搜索广告留资，待首次联系', createdAt: dayStr(-4), deletedAt: null },
    { id: 'l11', company: '厦门跨境电商产业园', contact: '林雅', position: '招商经理', phone: '159-3344-5566', email: 'linya@xmkj.com', source: '社交媒体', tags: ['海外客户'], status: 'unassigned', ownerId: null, remark: 'LinkedIn 咨询，东南亚仓配需求', createdAt: dayStr(-3), deletedAt: null },
    { id: 'l12', company: '宁波汽配制造有限公司', contact: '高翔', position: '副总经理', phone: '158-5566-7788', email: 'gaoxiang@nbqp.com', source: '客户转介绍', tags: ['大客户', '高意向'], status: 'unassigned', ownerId: null, remark: '天府建材周经理转介绍', createdAt: dayStr(-2), deletedAt: null },
    { id: 'l13', company: '长沙康宁医疗器械', contact: '何静', position: '行政主管', phone: '157-7788-9900', email: 'hejing@kn-med.com', source: '官方网站', tags: [], status: 'unassigned', ownerId: null, remark: '官网在线咨询客服系统', createdAt: dayStr(-1), deletedAt: null },
    { id: 'l14', company: '重庆宏图包装印刷', contact: '罗斌', position: '老板', phone: '156-9900-1122', email: 'luobin@htpack.com', source: '电话营销', tags: [], status: 'unassigned', ownerId: null, remark: '外呼接通，态度一般，待培育', createdAt: dayStr(0), deletedAt: null },
    /* 重复线索（用于演示查重）：电话与 l1 相同、公司名近似 */
    { id: 'l15', company: '深圳华科电子（东莞分公司）', contact: '王建国', position: '采购总监', phone: '138-0288-1101', email: 'wangjg@huake.com', source: '线上广告', tags: ['重复待核'], status: 'unassigned', ownerId: null, remark: '广告留资，疑似与展会线索重复', createdAt: dayStr(-2), deletedAt: null },
    /* 已废弃 */
    { id: 'l16', company: '天津某贸易公司', contact: '匿名', position: '', phone: '155-0000-0000', email: '', source: '电话营销', tags: [], status: 'discarded', ownerId: 'u3', remark: '空号且公司不存在', createdAt: dayStr(-25), deletedAt: null },
    /* 回收站 */
    { id: 'l17', company: '沈阳北方重工', contact: '徐强', position: '采购员', phone: '154-1111-2222', email: 'xuqiang@bfzg.com', source: '行业展会', tags: [], status: 'unassigned', ownerId: null, remark: '展会名片，客户明确无预算', createdAt: dayStr(-40), deletedAt: dateTimeStr(-6, 15) },
    { id: 'l18', company: '昆明春城花卉', contact: '杨莉', position: '销售经理', phone: '153-3333-4444', email: 'yangli@ccflower.com', source: '社交媒体', tags: [], status: 'unassigned', ownerId: null, remark: '误录入测试数据', createdAt: dayStr(-18), deletedAt: dateTimeStr(-3, 10) }
  ];

  const customers = [
    { id: 'c1', company: '深圳市华科电子有限公司', contact: '王建国', position: '采购总监', phone: '138-0288-1101', email: 'wangjg@huake.com', source: '行业展会', level: 'A', tags: ['高意向', '大客户'], ownerId: 'u2', locked: true, inPublicSea: false, address: '深圳市宝安区西乡街道华科工业园', lastFollowAt: dateTimeStr(-2, 14), createdAt: dayStr(-42), remark: '智能手表代采项目，年度框架客户' },
    { id: 'c2', company: '上海云途科技有限公司', contact: '李晓梅', position: 'IT经理', phone: '139-1122-3344', email: 'lixm@yuntu.cn', source: '官方网站', level: 'A', tags: ['预算充足', 'SaaS'], ownerId: 'u2', locked: true, inPublicSea: false, address: '上海市浦东新区张江高科技园区', lastFollowAt: dateTimeStr(-5, 10), createdAt: dayStr(-35), remark: '企业服务年费制客户，续费窗口期' },
    { id: 'c3', company: '北京智造机械股份公司', contact: '陈志远', position: '设备科长', phone: '137-5566-7788', email: 'chenzy@zhizao.com', source: '线上广告', level: 'B', tags: ['制造业'], ownerId: 'u3', locked: true, inPublicSea: false, address: '北京市大兴区亦庄经济开发区', lastFollowAt: dateTimeStr(-12, 16), createdAt: dayStr(-28), remark: '产线自动化改造二期' },
    { id: 'c4', company: '广州美裳服饰贸易', contact: '赵敏', position: '创始人', phone: '136-9988-0011', email: 'zhaomin@meishang.com', source: '社交媒体', level: 'C', tags: ['价格敏感'], ownerId: 'u4', locked: false, inPublicSea: false, address: '广州市海珠区中大布匹市场', lastFollowAt: dateTimeStr(-18, 11), createdAt: dayStr(-19), remark: '小单快返模式，预算有限' },
    { id: 'c5', company: '杭州鲜丰食品有限公司', contact: '黄磊', position: '运营主管', phone: '135-2233-4455', email: 'huanglei@xianfeng.com', source: '客户转介绍', level: 'B', tags: ['转介绍'], ownerId: 'u2', locked: true, inPublicSea: false, address: '杭州市余杭区良渚物流中心', lastFollowAt: dateTimeStr(-1, 15), createdAt: dayStr(-14), remark: '冷链车载温控设备试点' },
    { id: 'c6', company: '成都天府建材集团', contact: '周婷', position: '采购经理', phone: '134-6677-8899', email: 'zhouting@tianfu.com', source: '行业展会', level: 'A', tags: ['大客户', '年度集采'], ownerId: 'u5', locked: true, inPublicSea: false, address: '成都市金牛区建材路88号', lastFollowAt: dateTimeStr(-36, 9), createdAt: dayStr(-11), remark: '年度集采招标中，长期无人实质跟进' },
    { id: 'c7', company: '苏州精工模具厂', contact: '吴刚', position: '厂长', phone: '133-1100-2233', email: 'wugang@jinggong.com', source: '渠道合作', level: 'B', tags: [], ownerId: 'u3', locked: false, inPublicSea: false, address: '苏州市昆山市玉山镇模具城', lastFollowAt: dateTimeStr(-48, 14), createdAt: dayStr(-8), remark: '价格谈判僵持，销售跟进中断' },
    { id: 'c8', company: '武汉光通信技术公司', contact: '郑洁', position: '研发总监', phone: '132-4455-6677', email: 'zhengjie@gtx-tech.com', source: '官方网站', level: 'B', tags: ['技术型'], ownerId: 'u4', locked: true, inPublicSea: false, address: '武汉市东湖高新区光谷大道', lastFollowAt: dateTimeStr(-3, 17), createdAt: dayStr(-6), remark: '光模块测试设备需求' },
    /* 公海客户 */
    { id: 'c9', company: '南京化工原料公司', contact: '钱多多', position: '供应部', phone: '152-6677-8899', email: 'qian@njchem.com', source: '电话营销', level: 'C', tags: [], ownerId: null, locked: false, inPublicSea: true, address: '南京市六合区化工园', lastFollowAt: dateTimeStr(-60, 10), createdAt: dayStr(-70), remark: '原销售离职回收至公海' },
    { id: 'c10', company: '佛山顺德家电配件厂', contact: '冯建华', position: '总经理', phone: '151-7788-9900', email: 'fengjh@sdjd.com', source: '渠道合作', level: 'B', tags: ['制造业'], ownerId: null, locked: false, inPublicSea: true, address: '佛山市顺德区容桂街道', lastFollowAt: dateTimeStr(-55, 15), createdAt: dayStr(-65), remark: '超30天未跟进，系统回收至公海' }
  ];

  const contacts = [
    { id: 'ct1', customerId: 'c1', name: '王建国', position: '采购总监', phone: '138-0288-1101', email: 'wangjg@huake.com', note: '决策人，关注交期与账期' },
    { id: 'ct2', customerId: 'c1', name: '刘助理', position: '采购助理', phone: '138-0288-1102', email: 'liuzl@huake.com', note: '日常单据对接' },
    { id: 'ct3', customerId: 'c2', name: '李晓梅', position: 'IT经理', phone: '139-1122-3344', email: 'lixm@yuntu.cn', note: '技术选型负责人' },
    { id: 'ct4', customerId: 'c3', name: '陈志远', position: '设备科长', phone: '137-5566-7788', email: 'chenzy@zhizao.com', note: '' },
    { id: 'ct5', customerId: 'c5', name: '黄磊', position: '运营主管', phone: '135-2233-4455', email: 'huanglei@xianfeng.com', note: '王建国介绍' },
    { id: 'ct6', customerId: 'c6', name: '周婷', position: '采购经理', phone: '134-6677-8899', email: 'zhouting@tianfu.com', note: '招标流程规范，需资质齐全' },
    { id: 'ct7', customerId: 'c8', name: '郑洁', position: '研发总监', phone: '132-4455-6677', email: 'zhengjie@gtx-tech.com', note: '技术细节问得很深' },
    { id: 'ct8', customerId: 'c10', name: '冯建华', position: '总经理', phone: '151-7788-9900', email: 'fengjh@sdjd.com', note: '老板本人决策' }
  ];

  const logs = [
    { id: 'g1', customerId: 'c1', type: 'visit', content: '上门拜访华科电子，参观SMT车间，确认智能手表整机组装需求约3万台/年，客户要求两周内提供正式报价单与样品。', creatorId: 'u2', createdAt: dateTimeStr(-2, 14) },
    { id: 'g2', customerId: 'c1', type: 'quote', content: '发送智能手表方案报价单：标准版286元/台，旗舰版359元/台，账期月结30天。王总反馈价格略高于预期，约下周面谈。', creatorId: 'u2', createdAt: dateTimeStr(-6, 10) },
    { id: 'g3', customerId: 'c1', type: 'wechat', content: '微信沟通：客户确认收到样品，测试续航达标，对外观工艺满意，正在内部走立项流程。', creatorId: 'u2', createdAt: dateTimeStr(-11, 19) },
    { id: 'g4', customerId: 'c1', type: 'call', content: '首次电话沟通需求细节：客户目前供应商交期不稳定，希望寻找备选供应商，年采购额约800万。', creatorId: 'u2', createdAt: dateTimeStr(-40, 11) },
    { id: 'g5', customerId: 'c2', type: 'email', content: '邮件发送企业SaaS服务方案书与报价（年费12万，含实施培训），李经理约内部评审后反馈。', creatorId: 'u2', createdAt: dateTimeStr(-5, 10) },
    { id: 'g6', customerId: 'c2', type: 'call', content: '电话确认需求边界：500账号规模，需与现有钉钉打通，关注数据安全合规。', creatorId: 'u2', createdAt: dateTimeStr(-15, 15) },
    { id: 'g7', customerId: 'c2', type: 'note', content: '线索由官网表单转化，来源渠道标记为官方网站。', creatorId: 'u2', createdAt: dateTimeStr(-35, 9) },
    { id: 'g8', customerId: 'c3', type: 'call', content: '与陈科长沟通二期产线改造预算，客户内部预算约45万，希望本月内完成商务谈判。', creatorId: 'u3', createdAt: dateTimeStr(-12, 16) },
    { id: 'g9', customerId: 'c3', type: 'wechat', content: '微信发送同类产线案例视频，客户回复“已转老板看”。', creatorId: 'u3', createdAt: dateTimeStr(-20, 20) },
    { id: 'g10', customerId: 'c4', type: 'call', content: '电话回访，赵总认为报价偏高，表示再对比两家；已承诺提供精简版方案。', creatorId: 'u4', createdAt: dateTimeStr(-18, 11) },
    { id: 'g11', customerId: 'c5', type: 'visit', content: '拜访鲜丰食品良渚仓，现场勘测冷链车辆安装环境，确认首批试点20台车。', creatorId: 'u2', createdAt: dateTimeStr(-1, 15) },
    { id: 'g12', customerId: 'c5', type: 'wechat', content: '微信发送温控设备产品手册，黄主管转发给车队负责人评估。', creatorId: 'u2', createdAt: dateTimeStr(-8, 13) },
    { id: 'g13', customerId: 'c6', type: 'note', content: '建档跟进：展会现场登记年度集采需求，金额预计600万以上，需重点维护。', creatorId: 'u5', createdAt: dateTimeStr(-11, 10) },
    { id: 'g14', customerId: 'c7', type: 'call', content: '价格谈判：吴厂长要求下浮15%，超出权限已申请特批，后续未及时回访导致跟进中断。', creatorId: 'u3', createdAt: dateTimeStr(-48, 14) },
    { id: 'g15', customerId: 'c8', type: 'email', content: '邮件回复光模块测试设备技术参数问询，附白皮书与测试报告，郑总监表示满意。', creatorId: 'u4', createdAt: dateTimeStr(-3, 17) },
    { id: 'g16', customerId: 'c8', type: 'call', content: '首次电话了解研发测试场景：800G光模块产线测试，预算约30万。', creatorId: 'u4', createdAt: dateTimeStr(-6, 14) },
    { id: 'g17', customerId: 'c9', type: 'call', content: '最后一次外呼：客户称项目暂缓，此后未再联系，原销售离职后回收公海。', creatorId: 'u3', createdAt: dateTimeStr(-60, 10) },
    { id: 'g18', customerId: 'c10', type: 'visit', content: '上门演示设备，冯总认可但要求分期付款，跟进中断超30天被系统回收公海。', creatorId: 'u5', createdAt: dateTimeStr(-55, 15) }
  ];

  const opportunities = [
    { id: 'o1', name: '华科电子-智能手表年度采购', customerId: 'c1', products: '智能手表整机（标准版/旗舰版）', budget: 8000000, stage: 'negotiation', ownerId: 'u2', expectedClose: dayStr(9), inquiry: '客户寻求稳定备选供应商，年采3万台智能手表，关注交期与账期。', createdAt: dayStr(-40) },
    { id: 'o2', name: '云途科技-企业SaaS年度服务', customerId: 'c2', products: 'CRM+OA一体化SaaS 500账号', budget: 120000, stage: 'quote', ownerId: 'u2', expectedClose: dayStr(15), inquiry: '需与钉钉打通，关注数据安全与实施周期。', createdAt: dayStr(-30) },
    { id: 'o3', name: '智造机械-产线自动化二期', customerId: 'c3', products: '自动上下料机械臂×6 + 视觉检测', budget: 450000, stage: 'quote', ownerId: 'u3', expectedClose: dayStr(-5), inquiry: '二期产线改造，客户预算45万，要求本月完成谈判。（报价已超期未闭环）', createdAt: dayStr(-26) },
    { id: 'o4', name: '鲜丰食品-冷链温控试点', customerId: 'c5', products: '车载温控终端 20台试点', budget: 96000, stage: 'initial', ownerId: 'u2', expectedClose: dayStr(20), inquiry: '首批试点20台车，验证效果后推广至200台。', createdAt: dayStr(-12) },
    { id: 'o5', name: '天府建材-年度集采框架', customerId: 'c6', products: '劳保五金+工具耗材年度框架', budget: 6000000, stage: 'initial', ownerId: 'u5', expectedClose: dayStr(45), inquiry: '年度集采招标，需资质审核与招投标流程。', createdAt: dayStr(-10) },
    { id: 'o6', name: '光通信-800G测试设备采购', customerId: 'c8', products: '800G光模块误码测试平台', budget: 300000, stage: 'negotiation', ownerId: 'u4', expectedClose: dayStr(6), inquiry: '研发产线扩产，设备需通过内部技术评审。', createdAt: dayStr(-6) },
    { id: 'o7', name: '美裳服饰-ERP精简版', customerId: 'c4', products: '进销存ERP精简版 10账号', budget: 18000, stage: 'lost', ownerId: 'u4', expectedClose: dayStr(-8), inquiry: '预算有限，最终选择低价竞品。', createdAt: dayStr(-18) },
    { id: 'o8', name: '精工模具-模具钢材季度供货', customerId: 'c7', products: '模具钢 P20/718 季度批次', budget: 260000, stage: 'won', ownerId: 'u3', expectedClose: dayStr(-30), inquiry: '特批价格下浮12%后成交，已签框架。', createdAt: dayStr(-50) }
  ];

  const tasks = [
    { id: 't1', ownerId: 'u2', title: '给华科电子发送修订版报价单', date: dayStr(0), time: '10:30', category: '跟进', priority: 'high', customerId: 'c1', done: false, createdAt: dateTimeStr(-2, 17) },
    { id: 't2', ownerId: 'u2', title: '准备云途科技SaaS方案演示环境', date: dayStr(0), time: '14:00', category: '会议', priority: 'medium', customerId: 'c2', done: false, createdAt: dateTimeStr(-1, 18) },
    { id: 't3', ownerId: 'u2', title: '上门回访鲜丰食品试点安装进度', date: dayStr(2), time: '09:30', category: '拜访', priority: 'high', customerId: 'c5', done: false, createdAt: dateTimeStr(-1, 16) },
    { id: 't4', ownerId: 'u2', title: '电话回访厦门跨境电商（新线索）', date: dayStr(-1), time: '15:00', category: '拓客', priority: 'high', customerId: null, done: false, createdAt: dateTimeStr(-2, 11) },
    { id: 't5', ownerId: 'u2', title: '整理本周客户跟进记录', date: dayStr(1), time: '17:30', category: '其他', priority: 'low', customerId: null, done: false, createdAt: dateTimeStr(0, 9) },
    { id: 't6', ownerId: 'u3', title: '智造机械：特批价格内部申请', date: dayStr(-2), time: '11:00', category: '跟进', priority: 'high', customerId: 'c3', done: false, createdAt: dateTimeStr(-3, 10) },
    { id: 't7', ownerId: 'u3', title: '苏州精工模具厂回访（跟进中断客户）', date: dayStr(1), time: '10:00', category: '拓客', priority: 'high', customerId: 'c7', done: false, createdAt: dateTimeStr(0, 8) },
    { id: 't8', ownerId: 'u4', title: '武汉光通信技术评审答疑', date: dayStr(3), time: '14:00', category: '会议', priority: 'medium', customerId: 'c8', done: false, createdAt: dateTimeStr(-2, 15) },
    { id: 't9', ownerId: 'u4', title: '广州美裳服饰发送精简版方案', date: dayStr(-4), time: '16:00', category: '跟进', priority: 'medium', customerId: 'c4', done: true, createdAt: dateTimeStr(-5, 9) },
    { id: 't10', ownerId: 'u5', title: '天府建材招投标资质资料准备', date: dayStr(4), time: '09:00', category: '跟进', priority: 'high', customerId: 'c6', done: false, createdAt: dateTimeStr(-1, 14) },
    { id: 't11', ownerId: 'u5', title: '公海客户电话盘活：佛山顺德家电配件厂', date: dayStr(0), time: '16:00', category: '拓客', priority: 'medium', customerId: 'c10', done: false, createdAt: dateTimeStr(0, 9) },
    { id: 't12', ownerId: 'u1', title: '审批周斌提交的集采折扣申请', date: dayStr(0), time: '11:30', category: '会议', priority: 'high', customerId: null, done: false, createdAt: dateTimeStr(-1, 17) },
    { id: 't13', ownerId: 'u1', title: '销售周会：复盘线索转化率', date: dayStr(5), time: '10:00', category: '会议', priority: 'medium', customerId: null, done: false, createdAt: dateTimeStr(-1, 10) },
    { id: 't14', ownerId: 'u3', title: '完成东莞恒达五金首次外呼', date: dayStr(0), time: '15:00', category: '拓客', priority: 'low', customerId: null, done: true, createdAt: dateTimeStr(-1, 16) }
  ];

  const reports = [
    { id: 'r1', ownerId: 'u2', date: dayStr(0), done: '1. 上门拜访鲜丰食品，完成20台温控终端试点勘测；2. 与华科电子王总电话确认报价细节，对方内部立项中；3. 新线索电话联系2条。', plan: '1. 上午发送华科修订版报价单；2. 下午准备云途SaaS演示环境；3. 盘活公海客户1家。', help: '华科项目账期申请需要经理特批支持。', updatedAt: dateTimeStr(0, 18) },
    { id: 'r2', ownerId: 'u2', date: dayStr(-1), done: '1. 微信跟进华科电子，样品测试通过；2. 鲜丰食品方案修改并发送；3. 线索池分配新线索3条，已全部首联。', plan: '1. 拜访鲜丰食品现场勘测；2. 跟进云途科技评审进度。', help: '', updatedAt: dateTimeStr(-1, 18) },
    { id: 'r3', ownerId: 'u3', date: dayStr(-1), done: '1. 与智造机械陈科长确认预算45万；2. 外呼新线索5条，加微信2个；3. 精工模具特批流程发起。', plan: '1. 跟进特批结果；2. 重新激活精工模具厂客户。', help: '15%折扣特批流程较慢，希望经理加急。', updatedAt: dateTimeStr(-1, 17) },
    { id: 'r4', ownerId: 'u4', date: dayStr(-1), done: '1. 邮件回复光通信技术参数问题；2. 美裳服饰精简方案发送，客户仍在比价。', plan: '1. 预约光通信技术评审会；2. 继续培育美裳服饰。', help: '', updatedAt: dateTimeStr(-1, 18) },
    { id: 'r5', ownerId: 'u5', date: dayStr(-1), done: '1. 整理天府建材招投标资质清单；2. 公海盘活电话12通，有意向2家。', plan: '1. 完成资质资料盖章扫描；2. 跟进佛山家电配件厂。', help: '集采招标需要公司ISO认证原件。', updatedAt: dateTimeStr(-1, 17) },
    { id: 'r6', ownerId: 'u2', date: dayStr(-2), done: '1. 云途科技方案书与报价邮件发送；2. 线索查重合并1条重复线索；3. 日常客户维护电话6通。', plan: '推进华科报价与鲜丰勘测安排。', help: '', updatedAt: dateTimeStr(-2, 18) }
  ];

  return { users, leads, customers, contacts, logs, opportunities, tasks, reports };
}

/* ---------------- 存储对象 ---------------- */
const Store = {
  data: null,
  init() {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      try { this.data = JSON.parse(raw); return; } catch (e) { /* 数据损坏则重建 */ }
    }
    this.data = buildSeed();
    this.save();
  },
  save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
  },
  reset() {
    this.data = buildSeed();
    this.save();
  },
  /* 便捷查询 */
  user(id) { return this.data.users.find(u => u.id === id); },
  customer(id) { return this.data.customers.find(c => c.id === id); },
  lead(id) { return this.data.leads.find(l => l.id === id); },
  opp(id) { return this.data.opportunities.find(o => o.id === id); },
  customerLogs(cid) { return this.data.logs.filter(l => l.customerId === cid).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  customerContacts(cid) { return this.data.contacts.filter(c => c.customerId === cid); },
  customerOpps(cid) { return this.data.opportunities.filter(o => o.customerId === cid); }
};
