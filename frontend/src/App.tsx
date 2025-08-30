import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import BacktestPage from "./route/backtest/page";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { client } from "./lib/apollo-client";

function App() {
	return (
		<ApolloProvider client={client}>
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
						<Route
							path="/backtest"
							element={
								<ProtectedRoute>
									<BacktestPage />
								</ProtectedRoute>
							}
						/>
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
