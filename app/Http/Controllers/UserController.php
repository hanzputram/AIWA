<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Models\Membership;
use App\Models\Workspace;
use App\Models\AuditLog;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = session('current_workspace_id') ?? $request->user()->current_workspace_id;

        $memberships = Membership::with('user')
            ->where('workspace_id', $workspaceId)
            ->latest()
            ->get();

        $users = $memberships->map(function ($m) {
            $user = $m->user;
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username ?: explode('@', $user->email)[0],
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $m->role,
                'status' => $m->status,
                'created_at' => $user->created_at ? $user->created_at->format('d M Y') : '-',
            ];
        });

        return Inertia::render('users/Index', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $workspaceId = session('current_workspace_id') ?? $request->user()->current_workspace_id;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:50', 'regex:/^[a-zA-Z0-9_\-]+$/', 'unique:users,username'],
            'role' => ['required', 'string', 'in:owner,admin,manager,sales,agent,pricing_approver,operator'],
            'password' => ['required', 'string', 'min:6'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
        ], [
            'username.required' => 'Username wajib diisi untuk login pengguna.',
            'username.regex' => 'Username hanya boleh berisi huruf, angka, garis bawah (_), dan tanda hubung (-).',
            'username.unique' => 'Username ini sudah digunakan, silakan pilih username lain.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
        ]);

        $username = strtolower(trim($data['username']));
        $email = !empty($data['email']) ? trim($data['email']) : ($username . '@ats.co.id');

        // Check if fallback email already taken
        if (User::where('email', $email)->exists()) {
            $email = $username . '_' . time() . '@ats.co.id';
        }

        $user = User::create([
            'name' => trim($data['name']),
            'username' => $username,
            'email' => $email,
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'current_workspace_id' => $workspaceId,
        ]);

        Membership::create([
            'workspace_id' => $workspaceId,
            'user_id' => $user->id,
            'role' => $data['role'],
            'status' => 'active',
        ]);

        AuditLog::log('user.created', User::class, $user->id, [
            'username' => $username,
            'role' => $data['role'],
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "Pengguna baru [@{$username}] berhasil ditambahkan! Pengguna dapat langsung masuk menggunakan username: {$username}.");
    }

    public function update(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id') ?? $request->user()->current_workspace_id;
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:50', 'regex:/^[a-zA-Z0-9_\-]+$/', 'unique:users,username,' . $id],
            'role' => ['required', 'string', 'in:owner,admin,manager,sales,agent,pricing_approver,operator'],
            'password' => ['nullable', 'string', 'min:6'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users,email,' . $id],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $username = strtolower(trim($data['username']));
        $user->name = trim($data['name']);
        $user->username = $username;
        if (!empty($data['email'])) {
            $user->email = trim($data['email']);
        }
        if (!empty($data['phone'])) {
            $user->phone = trim($data['phone']);
        }
        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        Membership::updateOrCreate(
            ['workspace_id' => $workspaceId, 'user_id' => $user->id],
            ['role' => $data['role'], 'status' => 'active']
        );

        AuditLog::log('user.updated', User::class, $user->id, [
            'username' => $username,
            'role' => $data['role'],
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "Data pengguna [@{$username}] berhasil diperbarui.");
    }

    public function destroy(Request $request, int $id)
    {
        $workspaceId = session('current_workspace_id') ?? $request->user()->current_workspace_id;

        if ($id === Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
        }

        $user = User::findOrFail($id);
        $username = $user->username ?: $user->name;

        Membership::where('workspace_id', $workspaceId)->where('user_id', $id)->delete();
        $user->delete();

        AuditLog::log('user.deleted', User::class, $id, [
            'username' => $username,
            'deleted_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "Pengguna [@{$username}] berhasil dihapus dari sistem.");
    }
}
