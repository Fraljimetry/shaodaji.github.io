"""Current, release-independent live/archive integrity verifier (Cut 25 maintenance)."""
from manage_history import verify_installed

if __name__ == '__main__':
    verify_installed()
    print('PACKAGE_INTEGRITY_PASS: version-independent active file SHA and historical archive coverage')
