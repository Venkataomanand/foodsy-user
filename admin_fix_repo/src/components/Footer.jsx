export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-2xl font-bold text-primary">Foodsy</span>
                        <p className="mt-4 text-sm text-gray-500">
                            Student-founded delivery service for food, vegetables and groceries.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Contact Us</a></li>
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">FAQ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">About</a></li>
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Careers</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy</a></li>
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 pt-8">
                    <p className="text-base text-gray-400 text-center">&copy; 2024 Foodsy, Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
