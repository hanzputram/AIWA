<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response|\Illuminate\Http\RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/Login');
    }

    public function login(Request $request)
    {
        $rawInput = trim($request->input('username') ?? $request->input('email') ?? '');
        $loginInput = strtolower(ltrim($rawInput, '@'));
        $password = (string) $request->input('password');

        if (empty($loginInput) || empty($password)) {
            return back()->withErrors([
                'username' => 'Harap masukkan username dan kata sandi.',
            ])->onlyInput('username');
        }

        $user = \App\Models\User::whereRaw('LOWER(username) = ?', [$loginInput])
            ->orWhereRaw('LOWER(email) = ?', [$loginInput])
            ->first();

        if ($user && \Illuminate\Support\Facades\Hash::check($password, $user->password)) {
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();

            $workspace = $user->workspaces()->first() ?? \App\Models\Workspace::first();
            if ($workspace) {
                session(['current_workspace_id' => $workspace->id]);
                if (!$user->current_workspace_id) {
                    $user->current_workspace_id = $workspace->id;
                    $user->save();
                }
            }

            return redirect()->intended(route('dashboard'));
        }

        return back()->withErrors([
            'username' => 'Username atau kata sandi tidak cocok dengan data kami.',
        ])->onlyInput('username');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
