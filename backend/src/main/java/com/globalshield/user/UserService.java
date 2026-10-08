package com.globalshield.user;

import com.globalshield.common.PageResponse;
import com.globalshield.exception.BadRequestException;
import com.globalshield.exception.DuplicateResourceException;
import com.globalshield.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private boolean isAuthorizedEmailDomain(String email) {
        if (email == null) return false;
        String lower = email.toLowerCase().trim();
        return lower.endsWith("@gmail.com") || lower.endsWith("@outlook.com") || lower.endsWith("@aegis.local");
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserResponse> usersPage = userRepository.findAll(pageRequest).map(UserResponse::fromEntity);
        return PageResponse.from(usersPage);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (!isAuthorizedEmailDomain(email)) {
            throw new BadRequestException("Access denied. Only @gmail.com and @outlook.com email addresses are authorized.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User with email '" + request.getEmail() + "' already exists");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName().trim())
                .role(request.getRole())
                .enabled(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }
}
