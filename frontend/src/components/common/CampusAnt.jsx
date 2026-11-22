// เลือกรูปมาสคอตให้ตรงกับหน้าที่กำลังแสดง
import cafes from '../../assets/campus/ant-cafes.png';
import orders from '../../assets/campus/ant-orders.png';
import favorites from '../../assets/campus/ant-favorites.png';

const poses = { cafes, orders, favorites };

export default function CampusAnt({ pose }) {
  return <img className="campus-ant" src={poses[pose]} width="64" height="64" alt="" />;
}
