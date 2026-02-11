import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CategoryCard({ title, icon, color, link }) {
    return (
        <Link to={link}>
            <motion.div
                whileHover={{ scale: 1.05 }}
                className={`relative rounded-xl overflow-hidden shadow-md ${color} p-6 h-40 flex flex-col justify-between cursor-pointer transition-shadow hover:shadow-xl`}
            >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-2xl transform rotate-45"></div>

                <div className="text-4xl text-white z-10">
                    {icon}
                </div>

                <h3 className="text-xl font-bold text-white z-10">{title}</h3>
            </motion.div>
        </Link>
    );
}
