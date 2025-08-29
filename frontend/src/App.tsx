import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { backtestClient } from "./lib/apollo-client";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import BacktestPage from "./route/backtest/page";
import { Toaster } from "react-hot-toast";

function App() {
	return (
		<ApolloProvider client={backtestClient}>
			<AuthProvider>
				<Router>
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/signup" element={<Signup />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
						<Route path="/backtest" element={<BacktestPage />} />
						<Route
							path="/"
							element={<Navigate to="/login" replace />}
						/>
					</Routes>
					<Toaster />
				</Router>
			</AuthProvider>
		</ApolloProvider>
	);
}

export default App;
